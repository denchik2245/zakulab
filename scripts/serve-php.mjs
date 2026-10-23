import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const deployment = path.join(root, "build/beget");
const storage = process.env.ZAKULAB_STORAGE || path.join(root, "php/storage");
await fs.access(path.join(deployment, "public_html/index.php"));
await fs.mkdir(storage, { recursive: true, mode: 0o700 });
// Local CMS edits live outside the generated build, so rebuilding cannot erase them.
for (const name of ["initial-content.json", "media"]) {
  try { await fs.cp(path.join(deployment, "storage", name), path.join(storage, name), { recursive: true, force: false, errorOnExist: false }); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
const child = spawn(process.env.PHP_BINARY || "php", ["-d", "memory_limit=96M", "-d", "upload_max_filesize=8M", "-d", "post_max_size=9M", "-S", "127.0.0.1:8080", "-t", path.join(deployment, "public_html"), path.join(deployment, "public_html/router.php")], {
  stdio: "inherit",
  env: { ...process.env, SITE_URL: process.env.SITE_URL || "http://127.0.0.1:8080", ZAKULAB_STORAGE: storage, ZAKULAB_CONFIG: process.env.ZAKULAB_CONFIG || path.join(root, "php/config.local.php") },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code || 0; });
