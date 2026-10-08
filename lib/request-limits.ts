import "server-only";
import { createHash } from "node:crypto";
import { isNetlifyRuntime, readJSON, compareAndSetJSON } from "@/lib/atomic-store";

export class RequestTooLargeError extends Error {}

export async function limitedBody(request: Request, maxBytes: number) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes) throw new RequestTooLargeError();
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new RequestTooLargeError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString("utf8");
}

export function clientIdentity(request: Request) {
  // Netlify supplies this header at its edge. Do not trust arbitrary X-Forwarded-For.
  const address = isNetlifyRuntime() ? request.headers.get("x-nf-client-connection-ip") : null;
  // Fixed hash lanes bound persistent limiter storage; rare collisions share the same limit.
  return createHash("sha256").update(address || "shared-client").digest("hex").slice(0, 3);
}

export async function allowRequest(request: Request, scope: "login" | "review", limit: number, periodMs: number) {
  const identity = clientIdentity(request);
  const now = Date.now();
  const window = Math.floor(now / periodMs);
  for (let slot = 0; slot < limit; slot++) {
    const key = `limits/${scope}/${identity}/${slot}`;
    const entry = await readJSON<{ window: number }>(key);
    if (entry?.data.window === window) continue;
    if (await compareAndSetJSON(key, { window }, entry?.etag ?? null)) return true;
  }
  return false;
}
