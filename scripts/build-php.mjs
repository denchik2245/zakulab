import { build, transform } from "esbuild";
import postcss from "postcss";
import modules from "postcss-modules";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const root = process.cwd();
const output = path.join(root, "build/beget");
const hash = text => createHash("sha256").update(text).digest("hex").slice(0, 10);
await fs.mkdir("php/generated", { recursive: true });
const files = [];
async function walk(directory) {
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const name = path.join(directory, item.name);
    if (item.isDirectory()) await walk(name);
    else if (name.endsWith(".module.css")) files.push(name);
  }
}
await walk("components"); await walk("app");
const classMaps = {};
const css = [await fs.readFile("app/globals.css", "utf8"), await fs.readFile("public/fonts/fonts.css", "utf8")];
for (const file of files.sort()) {
  let mapping;
  const result = await postcss([modules({ generateScopedName: name => `z_${hash(file)}_${name}`, getJSON: (_file, json) => { mapping = json; } })]).process(await fs.readFile(file, "utf8"), { from: path.resolve(file) });
  css.push(result.css);
  classMaps[path.resolve(file)] = mapping;
}
const aliases = {
  "next/image": path.join(root, "php/frontend/next-image.tsx"),
  "next/link": path.join(root, "php/frontend/next-link.tsx"),
  "next/navigation": path.join(root, "php/frontend/next-navigation.ts"),
};
const plugin = { name: "php-browser", setup(builder) {
  builder.onResolve({ filter: /^next\/(image|link|navigation)$/ }, args => ({ path: aliases[args.path] }));
  builder.onResolve({ filter: /^server-only$/ }, () => ({ path: "empty", namespace: "empty" }));
  builder.onLoad({ filter: /.*/, namespace: "empty" }, () => ({ contents: "export {}" }));
  builder.onLoad({ filter: /\.module\.css$/ }, args => ({ contents: `export default ${JSON.stringify(classMaps[args.path])}`, loader: "js" }));
} };
const common = { bundle: true, plugins: [plugin], tsconfig: "tsconfig.json", jsx: "automatic", logLevel: "warning" };
// Export schemas and normalized data using the existing migration logic; no server is required.
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "zakulab-php-build-"));
await build({ ...common, entryPoints: ["php/frontend/export.ts"], outfile: path.join(temporary, "export.cjs"), platform: "node", format: "cjs", packages: "external" });
// External packages resolve from this project's node_modules, even when the temporary file is elsewhere.
const require = createRequire(import.meta.url);
const { Module } = require("node:module");
const exported = new Module(path.join(root, ".php-export.cjs"));
exported.filename = path.join(root, ".php-export.cjs");
exported.paths = Module._nodeModulePaths(root);
exported._compile(await fs.readFile(path.join(temporary, "export.cjs"), "utf8"), exported.filename);
const netlifyEnv = Object.fromEntries(["NETLIFY", "NETLIFY_LOCAL", "SITE_ID"].map(key => [key, process.env[key]]));
for (const key of Object.keys(netlifyEnv)) delete process.env[key];
process.chdir(temporary);
const seed = await exported.exports.readContent(false);
process.chdir(root);
const local = await exported.exports.readContent(true);
for (const [key, value] of Object.entries(netlifyEnv)) if (value !== undefined) process.env[key] = value;
await fs.writeFile("php/generated/seed.json", JSON.stringify(seed));
await fs.writeFile("php/generated/schema.json", JSON.stringify(exported.exports.schema));
const styleBundle = await build({ ...common, entryPoints: ["php/frontend/styles.ts"], platform: "node", format: "cjs", write: false });
const styleModule = new Module(path.join(root, ".php-styles.cjs"));
styleModule.filename = path.join(root, ".php-styles.cjs");
styleModule._compile(styleBundle.outputFiles[0].text, styleModule.filename);
await fs.writeFile("php/generated/styles.json", JSON.stringify(styleModule.exports.styles));
const staticMarks = await build({ ...common, stdin: { contents: 'import {renderToStaticMarkup} from "react-dom/server"; import {SocialLinks} from "./components/social-links"; import {TgIcon, WebIcon, ArrowIcon} from "./components/review-icons"; export const social=renderToStaticMarkup(<SocialLinks telegramUrl="__TG__" maxUrl="__MAX__" vkUrl="__VK__"/>); export const icons={tg:renderToStaticMarkup(<TgIcon/>),web:renderToStaticMarkup(<WebIcon/>),arrow:renderToStaticMarkup(<ArrowIcon/>)};', resolveDir: root, loader: "tsx" }, platform: "node", format: "cjs", packages: "external", write: false });
const marksModule = new Module(path.join(root, ".php-marks.cjs"));
marksModule.filename = path.join(root, ".php-marks.cjs");
marksModule.paths = Module._nodeModulePaths(root);
marksModule._compile(staticMarks.outputFiles[0].text, marksModule.filename);
await fs.writeFile("php/generated/marks.json", JSON.stringify(marksModule.exports));
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(path.join(output, "public_html/bundles"), { recursive: true });
await fs.cp("public", path.join(output, "public_html"), { recursive: true });
await fs.cp("php/public", path.join(output, "public_html"), { recursive: true });
for (const directory of ["src", "templates", "generated"]) await fs.cp(`php/${directory}`, path.join(output, "app", directory), { recursive: true });
await fs.copyFile("php/config.example.php", path.join(output, "config.example.php"));
await fs.copyFile("php/console.php", path.join(output, "console.php"));
await fs.mkdir(path.join(output, "storage"), { recursive: true });
// Image resizing happens once on the developer's machine, never on a public page request.
const imageMap = {};
await fs.mkdir(path.join(output, "public_html/optimized"), { recursive: true });
async function optimizeDirectory(directory) {
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await optimizeDirectory(file);
    else if (/\.(?:png|jpe?g|webp)$/i.test(item.name)) {
      const metadata = await sharp(file).metadata();
      if (!metadata.width || !metadata.height || (metadata.pages || 1) > 1) continue;
      const widths = [...new Set([320, 640, 960, 1600, 2400].map(width => Math.min(metadata.width, width)))];
      const variants = [];
      for (const width of widths) {
        const name = `${hash(await fs.readFile(file))}-${width}.webp`;
        await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(output, "public_html/optimized", name));
        variants.push(`/optimized/${name} ${width}w`);
      }
      imageMap['/' + file.replace(/^public\//, '')] = { src: variants.at(-1).split(' ')[0], srcset: variants.join(', ') };
    }
  }
}
await optimizeDirectory('public/assets');
await fs.writeFile(path.join(output, "app/generated/images.json"), JSON.stringify(imageMap));
// Browser image components read this immutable mapping; uploaded images use their PHP media route.
const imagesName = `images-${hash(JSON.stringify(imageMap))}.js`;
await fs.writeFile(path.join(output, "public_html/bundles", imagesName), 'window.zakulabImages=' + JSON.stringify(imageMap) + ';');
// This import is private and is only used to seed a new installation. Never publish storage/ as a document root.
await fs.writeFile(path.join(output, "storage/initial-content.json"), JSON.stringify(local));
try { await fs.cp(".data/media", path.join(output, "storage/media"), { recursive: true }); } catch (error) { if (error.code !== "ENOENT") throw error; }
// Prefer saved PHP development data when present. Configuration, rate limits and backups stay local.
for (const name of ["initial-content.json", "db/content.json", "db/queue.json", "db/requests.json", "media"]) {
  try {
    await fs.mkdir(path.dirname(path.join(output, "storage", name)), { recursive: true });
    await fs.cp(path.join(root, "php/storage", name), path.join(output, "storage", name), { recursive: true });
  } catch (error) { if (error.code !== "ENOENT") throw error; }
}
const browser = await build({ ...common, entryPoints: { site: "php/frontend/public.tsx", admin: "php/frontend/admin.tsx" }, outdir: path.join(output, "public_html/bundles"), entryNames: "[name]-[hash]", chunkNames: "chunk-[hash]", platform: "browser", format: "esm", splitting: true, minify: true, target: ["es2022"], metafile: true, define: { "process.env.NODE_ENV": '"production"' } });
css.push(await fs.readFile("app/admin/admin-responsive.css", "utf8"));
css.push('.php-inbox{max-width:1440px;margin:40px auto;padding:32px;background:#fff}.php-inbox article{border-top:1px solid #ddd;padding:24px 0}.php-inbox pre{white-space:pre-wrap;overflow-wrap:anywhere}.php-inbox button{padding:10px 16px;cursor:pointer}.php-loading{padding:80px 32px}.php-nojs{padding:16px;text-align:center}');
const finalCss = (await transform(css.join("\n"), { loader: "css", minify: true })).code;
const cssName = `site-${hash(finalCss)}.css`;
await fs.writeFile(path.join(output, "public_html/bundles", cssName), finalCss);
const manifest = { css: `/bundles/${cssName}`, images: `/bundles/${imagesName}` };
for (const [file, meta] of Object.entries(browser.metafile.outputs)) if (meta.entryPoint) manifest[meta.entryPoint.includes("admin.tsx") ? "admin" : "site"] = "/bundles/" + path.basename(file);
await fs.writeFile(path.join(output, "app/generated/assets.json"), JSON.stringify(manifest));
// Include a seed cache for Apache; the first real save invalidates it automatically.
execFileSync(process.env.PHP_BINARY || "php", [path.join(output, "console.php"), "warm-cache"], { cwd: root, stdio: "inherit" });
await fs.copyFile("PHP-HOSTING.md", path.join(output, "README.md"));
await fs.rm(temporary, { recursive: true, force: true });
console.log(`PHP deployment prepared: ${path.relative(root, output)}/ (upload public_html as the document root; app and storage stay outside).`);
