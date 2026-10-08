import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const adminCookieName = "zakulab-admin";
const sessionLifetime = 60 * 60 * 24 * 7;

function sessionSecret() {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  if (process.env.NODE_ENV !== "production") return "zakulab-local-development-secret";
  return "";
}

export function isAdminConfigured() {
  const hasPassword = Boolean(process.env.ADMIN_PASSWORD) || process.env.NODE_ENV !== "production";
  return hasPassword && Boolean(sessionSecret());
}

function sign(value: string) {
  // Password rotation invalidates every previously issued cookie, including legacy cookies.
  return createHmac("sha256", sessionSecret()).update(process.env.ADMIN_PASSWORD ?? "admin").update("\0").update(value).digest("base64url");
}

export function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + sessionLifetime })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token?: string) {
  if (!token || !isAdminConfigured() || token.length > 2048) return false;
  const [payload, signature, extra] = token.split(".");
  if (extra !== undefined) return false;
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  return verifyAdminSession((await cookies()).get(adminCookieName)?.value);
}

export function validateAdminPassword(password: string) {
  if (!isAdminConfigured()) return false;
  const configured = process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV !== "production" ? "admin" : "");
  if (!configured || !password) return false;
  const expected = Buffer.from(configured);
  const received = Buffer.from(password);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
