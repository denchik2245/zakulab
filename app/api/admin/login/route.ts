import { NextResponse } from "next/server";
import { adminCookieName, createAdminSession, isAdminConfigured, validateAdminPassword } from "@/lib/admin-auth";
import { allowRequest, limitedBody, RequestTooLargeError } from "@/lib/request-limits";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Добавьте ADMIN_PASSWORD и ADMIN_SESSION_SECRET в настройках окружения" }, { status: 503 });
  }
  if (!await allowRequest(request, "login", 10, 15 * 60 * 1000)) return NextResponse.json({ error: "Слишком много попыток. Повторите через 15 минут." }, { status: 429, headers: { "Retry-After": "900" } });
  let body: { password?: unknown };
  try { body = JSON.parse(await limitedBody(request, 4096)); }
  catch (error) { return NextResponse.json({ error: "Некорректный запрос" }, { status: error instanceof RequestTooLargeError ? 413 : 400 }); }
  if (!body || typeof body.password !== "string" || !validateAdminPassword(body.password)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, createAdminSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
