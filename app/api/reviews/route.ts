import { NextResponse } from "next/server";
import { readContent } from "@/lib/content-store";
import { enqueueReview } from "@/lib/review-queue";
import { allowRequest, limitedBody, RequestTooLargeError } from "@/lib/request-limits";
import type { VerifiedReview } from "@/lib/reviews";
import { externalUrl } from "@/lib/external-url";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
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
  if (!await allowRequest(request, "review", 3, 60 * 60 * 1000)) return NextResponse.json({ error: "Слишком много отправок. Попробуйте через час." }, { status: 429, headers: { "Retry-After": "3600" } });
  let formData: FormData;
  try {
    const body = await limitedBody(request, 32 * 1024);
    formData = await new Request(request.url, { method: "POST", headers: request.headers, body }).formData();
  } catch (error) {
    return NextResponse.json({ error: "Некорректная или слишком большая форма" }, { status: error instanceof RequestTooLargeError ? 413 : 400 });
  }
  if (field(formData, "bot-field")) return new NextResponse(null, { status: 204 });

  const name = field(formData, "name");
  const role = field(formData, "role");
  const profileUrl = field(formData, "public-profile");
  const text = field(formData, "review");
  const safeProfileUrl = publicUrl(externalUrl(profileUrl));

  if (!name || name.length > 120 || !role || role.length > 120 || !safeProfileUrl || safeProfileUrl.length > 500 || text.length < 20 || text.length > 4000 || field(formData, "consent") !== "yes") {
    return NextResponse.json({ error: "Заполните все поля и подтвердите согласие на обработку и публикацию. Текст отзыва: от 20 до 4000 символов." }, { status: 400 });
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
    consent: { acceptedAt: now, version: "2026-10-08" },
  };

  const content = await readContent(true);
  if (!await enqueueReview(review, content)) return NextResponse.json({ error: "Очередь отзывов заполнена. Попробуйте позже." }, { status: 503, headers: { "Retry-After": "3600" } });
  if (field(formData, "response") === "json") return NextResponse.json({ ok: true }, { status: 201 });
  return NextResponse.redirect(new URL("/success?form=review", request.url), 303);
}
