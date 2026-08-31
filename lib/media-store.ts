import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";

const localMediaDirectory = path.join(process.cwd(), ".data", "media");
const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export const maxMediaSize = 8 * 1024 * 1024;

function isNetlifyRuntime() {
  return process.env.NETLIFY === "true" || process.env.NETLIFY_LOCAL === "true";
}

function isSafeKey(key: string) {
  return /^[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(key);
}

export async function saveMedia(file: File) {
  const extension = allowedTypes.get(file.type);
  if (!extension) throw new Error("UNSUPPORTED_MEDIA_TYPE");
  if (file.size > maxMediaSize) throw new Error("MEDIA_TOO_LARGE");

  const key = `${randomUUID()}.${extension}`;
  const bytes = await file.arrayBuffer();

  if (isNetlifyRuntime()) {
    await getStore("zakulab-media").set(key, bytes, {
      metadata: { contentType: file.type, originalName: file.name },
    });
  } else {
    await fs.mkdir(localMediaDirectory, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(localMediaDirectory, key), Buffer.from(bytes)),
      fs.writeFile(path.join(localMediaDirectory, `${key}.json`), JSON.stringify({ contentType: file.type, originalName: file.name })),
    ]);
  }

  return { key, url: `/api/media/${key}` };
}

export async function readMedia(key: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  if (!isSafeKey(key)) return null;

  if (isNetlifyRuntime()) {
    const result = await getStore("zakulab-media").getWithMetadata(key, { type: "arrayBuffer", consistency: "strong" });
    if (!result) return null;
    return { data: result.data, contentType: String(result.metadata.contentType || "application/octet-stream") };
  }

  try {
    const [data, metadata] = await Promise.all([
      fs.readFile(path.join(localMediaDirectory, key)),
      fs.readFile(path.join(localMediaDirectory, `${key}.json`), "utf8")
        .then((value): { contentType?: string } => JSON.parse(value) as { contentType?: string })
        .catch((): { contentType?: string } => ({})),
    ]);
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    return { data: arrayBuffer, contentType: metadata.contentType || "application/octet-stream" };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
