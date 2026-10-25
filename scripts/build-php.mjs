import { build, transform } from "esbuild";
import postcss from "postcss";
import modules from "postcss-modules";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { gzipSync, brotliCompressSync, constants as zlibConstants } from "node:zlib";
import sharp from "sharp";

const root = process.cwd();
const output = path.join(root, "build/beget");
const hash = text => createHash("sha256").update(text).digest("hex").slice(0, 10);
// Serve generated resources through PHP where the hosting proxy strips static
// cache headers. Physical paths remain available for deployments and rollbacks.
const assetUrl = (directory, name) => `/api/assets/${directory}/${name}`;
await fs.mkdir("php/generated", { recursive: true });
const files = [];
async function walk(directory) {
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const name = path.join(directory, item.name);
    if (item.isDirectory()) await walk(name);
    else if (name.endsWith(".module.css")) files.push(name);
  }
}
await walk("components"); await walk("php/styles");
const classMaps = {};
const globalCss = await fs.readFile("styles/globals.css", "utf8");
const fontCss = await fs.readFile("public/fonts/fonts.css", "utf8");
const moduleCss = new Map();
// Module order is part of the cascade: elements can carry classes from two modules.
// Keep the order the site was designed with (case page first, then by file name).
const cascadeKey = file => (path.basename(file) === "case-page.module.css" ? "0" : "1") + path.basename(file);
files.sort((a, b) => cascadeKey(a).localeCompare(cascadeKey(b)));
for (const file of files) {
  let mapping;
  const result = await postcss([modules({ generateScopedName: name => `z_${hash(file)}_${name}`, getJSON: (_file, json) => { mapping = json; } })]).process(await fs.readFile(file, "utf8"), { from: path.resolve(file) });
  moduleCss.set(file, result.css);
  classMaps[path.resolve(file)] = mapping;
}
const plugin = { name: "php-browser", setup(builder) {
  builder.onLoad({ filter: /\.module\.css$/ }, args => ({ contents: `export default ${JSON.stringify(classMaps[args.path])}`, loader: "js" }));
} };
const common = { bundle: true, plugins: [plugin], tsconfig: "tsconfig.json", jsx: "automatic", logLevel: "warning" };
// Export the JSON Schema used by PHP validation and check the frozen seed against it.
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "zakulab-php-build-"));
await build({ ...common, entryPoints: ["php/frontend/export.ts"], outfile: path.join(temporary, "export.cjs"), platform: "node", format: "cjs", packages: "external" });
// External packages resolve from this project's node_modules, even when the temporary file is elsewhere.
const require = createRequire(import.meta.url);
const { Module } = require("node:module");
const exported = new Module(path.join(root, ".php-export.cjs"));
exported.filename = path.join(root, ".php-export.cjs");
exported.paths = Module._nodeModulePaths(root);
exported._compile(await fs.readFile(path.join(temporary, "export.cjs"), "utf8"), exported.filename);
const seed = JSON.parse(await fs.readFile("php/seed.json", "utf8"));
exported.exports.checkSeed(seed);
await fs.writeFile("php/generated/seed.json", JSON.stringify(seed));
await fs.writeFile("php/generated/schema.json", JSON.stringify(exported.exports.schema));
const styleBundle = await build({ ...common, entryPoints: ["php/frontend/styles.ts"], platform: "node", format: "cjs", write: false, metafile: true });
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
    else if (/\.(?:png|jpe?g|webp|gif|svg)$/i.test(item.name)) {
      const metadata = await sharp(file).metadata();
      if (!metadata.width || !metadata.height) continue;
      // rotate() below applies EXIF orientation, including orientations that swap axes.
      const swapsAxes = [5, 6, 7, 8].includes(metadata.orientation);
      const width = swapsAxes ? metadata.height : metadata.width;
      const height = swapsAxes ? metadata.width : metadata.height;
      const sourcePath = '/' + file.replace(/^public\//, '');
      if (/\.(?:svg|gif)$/i.test(item.name) || (metadata.pages || 1) > 1) {
        imageMap[sourcePath] = { width, height };
        continue;
      }
      const widths = [...new Set([320, 640, 960, 1600, 2400].map(size => Math.min(width, size)))];
      const digest = hash(await fs.readFile(file));
      const variants = [];
      for (const width of widths) {
        const name = `${digest}-${width}.webp`;
        await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(output, "public_html/optimized", name));
        variants.push(`${assetUrl('optimized', name)} ${width}w`);
      }
      const fallbackIndex = widths.findIndex(size => size >= Math.min(width, 960));
      imageMap[sourcePath] = { src: variants[fallbackIndex].split(' ')[0], srcset: variants.join(', '), width, height };
    }
  }
}
await optimizeDirectory('public/assets');
// The repeating texture is drawn at 567 CSS pixels; a full PNG is unnecessary.
const textureSource = 'public/assets/figma/image44.png';
const textureName = `${hash(await fs.readFile(textureSource))}-texture-567.webp`;
await sharp(textureSource).rotate().resize({ width: 567, withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.join(output, 'public_html/optimized', textureName));
await fs.writeFile(path.join(output, "app/generated/images.json"), JSON.stringify(imageMap));
// Browser image components read this immutable mapping; uploaded images use their PHP media route.
const imagesName = `images-${hash(JSON.stringify(imageMap))}.js`;
await fs.writeFile(path.join(output, "public_html/bundles", imagesName), 'window.zakulabImages=' + JSON.stringify(imageMap) + ';');
// Saved PHP development data seeds the package when present; never publish storage/ as a document root.
// Configuration, rate limits and backups stay local. Without it PHP falls back to php/seed.json.
for (const name of ["initial-content.json", "db/content.json", "db/queue.json", "db/requests.json", "media"]) {
  try {
    await fs.mkdir(path.dirname(path.join(output, "storage", name)), { recursive: true });
    await fs.cp(path.join(root, "php/storage", name), path.join(output, "storage", name), { recursive: true });
  } catch (error) { if (error.code !== "ENOENT") throw error; }
}
const browser = await build({ ...common, entryPoints: { site: "php/frontend/public.tsx", admin: "php/frontend/admin.tsx" }, outdir: path.join(output, "public_html/bundles"), entryNames: "[name]-[hash]", chunkNames: "chunk-[hash]", platform: "browser", format: "esm", splitting: true, minify: true, target: ["es2022"], metafile: true, define: { "process.env.NODE_ENV": '"production"' } });
function requiredModules(metafile, entry) {
  const inputs = metafile.inputs;
  const visited = new Set();
  function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    for (const item of inputs[file]?.imports || []) if (!item.external) visit(item.path);
  }
  visit(entry);
  return new Set([...visited].filter(file => file.endsWith('.module.css')));
}
const publicModules = new Set([...requiredModules(browser.metafile, 'php/frontend/public.tsx'), ...requiredModules(styleBundle.metafile, 'php/frontend/styles.ts')]);
const adminModules = requiredModules(browser.metafile, 'php/frontend/admin.tsx');
// Global styles are shared by the site and the admin panel. Strip admin-only selectors
// from the public artifact without modifying that source or changing admin cascade order.
const publicGlobals = postcss.parse(globalCss);
publicGlobals.walkRules(rule => {
  const selectors = rule.selectors.filter(selector => !/[.#]admin[\w-]*/.test(selector));
  if (selectors.length) rule.selectors = selectors;
  else rule.remove();
});
publicGlobals.walkAtRules(rule => { if (rule.nodes && rule.nodes.length === 0) rule.remove(); });
const extras = '.php-loading{padding:80px 32px}.php-nojs{padding:16px;text-align:center}';
async function writeStyles(name, sources) {
  const source = sources.join('\n')
    .replaceAll('/assets/figma/image44.png', `/optimized/${textureName}`)
    .replace(/url\(\s*(["']?)\/(fonts|optimized)\//g, 'url($1/api/assets/$2/');
  const compiled = (await transform(source, { loader: 'css', minify: true })).code;
  const file = `${name}-${hash(compiled)}.css`;
  await fs.writeFile(path.join(output, 'public_html/bundles', file), compiled);
  return assetUrl('bundles', file);
}
const publicCss = await writeStyles('site', [publicGlobals.toString(), fontCss, ...[...moduleCss].filter(([file]) => publicModules.has(file)).map(([, source]) => source), extras]);
const adminCss = await writeStyles('admin', [globalCss, fontCss, ...[...moduleCss].filter(([file]) => adminModules.has(file)).map(([, source]) => source), await fs.readFile('styles/admin-responsive.css', 'utf8'), extras]);
const manifest = { css: publicCss, adminCss, images: assetUrl('bundles', imagesName), texture: assetUrl('optimized', textureName) };
for (const [file, meta] of Object.entries(browser.metafile.outputs)) if (meta.entryPoint) manifest[meta.entryPoint.includes("admin.tsx") ? "admin" : "site"] = assetUrl('bundles', path.basename(file));
await fs.writeFile(path.join(output, "app/generated/assets.json"), JSON.stringify(manifest));
// Apache and the development server can serve these directly even where the
// hosting account does not offer runtime compression. Packaging includes them.
async function precompress(directory) {
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await precompress(file);
    else if (/\.(?:css|js|json|svg|xml|txt|woff2?)$/i.test(item.name)) {
      const source = await fs.readFile(file);
      if (source.length < 256) continue;
      const gzip = gzipSync(source, { level: 9 });
      const brotli = brotliCompressSync(source, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 } });
      if (gzip.length < source.length) await fs.writeFile(file + '.gz', gzip);
      if (brotli.length < source.length) await fs.writeFile(file + '.br', brotli);
    }
  }
}
await precompress(path.join(output, 'public_html'));
// Include a seed cache for Apache; the first real save invalidates it automatically.
execFileSync(process.env.PHP_BINARY || "php", [path.join(output, "console.php"), "warm-cache"], { cwd: root, stdio: "inherit" });
await fs.copyFile("PHP-HOSTING.md", path.join(output, "README.md"));
await fs.rm(temporary, { recursive: true, force: true });
console.log(`PHP deployment prepared: ${path.relative(root, output)}/ (upload public_html as the document root; app and storage stay outside).`);
