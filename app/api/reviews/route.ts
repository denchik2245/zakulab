import { NextResponse } from "next/server";
import { readContent, writeContent } from "@/lib/content-store";
import type { VerifiedReview } from "@/lib/reviews";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "—";
}

function publicUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  if (field(formData, "bot-field")) return new NextResponse(null, { status: 204 });

  const name = field(formData, "name");
  const company = field(formData, "company");
  const role = field(formData, "role");
  const projectName = field(formData, "project-name");
  const projectUrl = field(formData, "project-url");
  const profileNetwork = field(formData, "profile-network") as VerifiedReview["profile"]["network"];
  const profileUrl = field(formData, "public-profile");
  const text = field(formData, "review");
  const hasConsent = formData.has("publication-consent") && formData.has("public-contact-awareness") && formData.has("privacy-consent");

  const allowedNetworks: VerifiedReview["profile"]["network"][] = ["Telegram", "MAX", "VK", "LinkedIn", "Другая сеть"];
  const safeProjectUrl = publicUrl(projectUrl);
  const safeProfileUrl = profileUrl.startsWith("@") && profileNetwork === "Telegram"
    ? `https://t.me/${profileUrl.slice(1)}`
    : publicUrl(profileUrl);

  if (!name || !company || !role || !projectName || !safeProjectUrl || !safeProfileUrl || !allowedNetworks.includes(profileNetwork) || text.length < 20 || !hasConsent) {
    return NextResponse.json({ error: "Заполните обязательные поля и подтвердите согласия" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const review: VerifiedReview = {
    id: `review-${crypto.randomUUID()}`,
    status: "pending",
    submittedAt: now,
    publishedAt: now.slice(0, 10),
    text: text.slice(0, 4000),
    author: { name: name.slice(0, 120), initials: initials(name), role: role.slice(0, 120), company: company.slice(0, 120) },
    project: { name: projectName.slice(0, 160), url: safeProjectUrl.slice(0, 500) },
    profile: { network: profileNetwork, label: profileUrl.slice(0, 180), url: safeProfileUrl.slice(0, 500) },
  };

  const content = await readContent();
  content.reviews.unshift(review);
  await writeContent(content);
  return NextResponse.redirect(new URL("/success?form=review", request.url), 303);
}
