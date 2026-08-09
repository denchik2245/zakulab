import { NextResponse } from "next/server";
import { adminCookieName, createAdminSession, isAdminConfigured, validateAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Добавьте ADMIN_PASSWORD и ADMIN_SESSION_SECRET в настройках окружения" }, { status: 503 });
  }
  const body = await request.json().catch(() => ({})) as { password?: string };
  if (!validateAdminPassword(body.password ?? "")) {
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
