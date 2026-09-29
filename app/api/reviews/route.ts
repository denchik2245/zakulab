import { NextResponse } from "next/server";
import { readContent, writeContent } from "@/lib/content-store";
import type { VerifiedReview } from "@/lib/reviews";
import { externalUrl } from "@/lib/external-url";

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
  const role = field(formData, "role");
  const profileUrl = field(formData, "public-profile");
  const text = field(formData, "review");
  const safeProfileUrl = publicUrl(externalUrl(profileUrl));

  if (!name || !role || !safeProfileUrl || text.length < 20) {
    return NextResponse.json({ error: "Заполните все поля. Текст отзыва должен быть не короче 20 символов." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const review: VerifiedReview = {
    id: `review-${crypto.randomUUID()}`,
    status: "pending",
    submittedAt: now,
    publishedAt: now.slice(0, 10),
    showOnHome: false,
    showOnReviewsPage: false,
    order: Date.now(),
    text: text.slice(0, 4000),
    author: { name: name.slice(0, 120), initials: initials(name), role: role.slice(0, 120), company: "" },
    project: { name: "", url: "" },
    profile: { network: "Другая сеть", label: "", url: safeProfileUrl.slice(0, 500) },
  };

  const content = await readContent();
  content.reviews.unshift(review);
  await writeContent(content);
  if (field(formData, "response") === "json") return NextResponse.json({ ok: true }, { status: 201 });
  return NextResponse.redirect(new URL("/success?form=review", request.url), 303);
}
