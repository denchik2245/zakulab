import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";

export type Stored<T> = { data: T; etag: string };
export function isNetlifyRuntime() {
  return process.env.NETLIFY === "true" || process.env.NETLIFY_LOCAL === "true";
}

function filename(key: string) {
  if (!/^[a-z0-9/-]+$/.test(key)) throw new Error("Invalid storage key");
  return path.join(process.cwd(), ".data", key === "content-v1" ? "zakulab-content.json" : `${key}.json`);
}

export async function readJSON<T>(key: string): Promise<Stored<T> | null> {
  if (isNetlifyRuntime()) {
    const entry = await getStore("zakulab-cms").getWithMetadata(key, { type: "json", consistency: "strong" });
    if (!entry) return null;
    if (!entry.etag) throw new Error("Storage did not return a version");
    return { data: entry.data as T, etag: entry.etag };
  }
  try {
    const raw = await fs.readFile(filename(key), "utf8");
    return { data: JSON.parse(raw) as T, etag: createHash("sha256").update(raw).digest("hex") };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

// One conditional write; callers must handle conflicts rather than overwrite a newer snapshot.
export async function compareAndSetJSON(key: string, value: unknown, expected: string | null): Promise<boolean> {
  if (isNetlifyRuntime()) {
    const result = await getStore("zakulab-cms").setJSON(key, value, expected === null ? { onlyIfNew: true } : { onlyIfMatch: expected });
    return result.modified;
  }
  const target = filename(key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  let lock;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { lock = await fs.open(`${target}.lock`, "wx"); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  if (!lock) throw new Error("Storage busy; retry the request");
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    if ((await readJSON(key))?.etag !== (expected ?? undefined)) return false;
    await fs.writeFile(temporary, JSON.stringify(value, null, 2), "utf8");
    await fs.rename(temporary, target);
    return true;
  } finally {
    await fs.unlink(temporary).catch(() => {});
    await lock.close();
    await fs.unlink(`${target}.lock`);
  }
}
