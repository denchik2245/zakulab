import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const directory = path.resolve(process.argv[2] || "php/storage/media");
let prepared = 0;
for (const name of await fs.readdir(directory)) {
  if (!/^[a-f0-9-]{16,64}\.(png|jpg|webp|gif)$/.test(name)) continue;
  const file = path.join(directory, name);
  const image = sharp(file);
  const info = await image.metadata();
  const metadata = { contentType: `image/${info.format === "jpeg" ? "jpeg" : info.format}`, width: info.width, height: info.height };
  if (info.format !== "gif" && (info.pages || 1) === 1) {
    for (const width of [320, 640, 1280, 1920]) {
      if (width >= info.width) continue;
      const preview = `${file}.${width}.webp`;
      try { await fs.access(preview); }
      catch { await sharp(file).resize({ width, withoutEnlargement: true }).webp({ quality: 88 }).toFile(preview); await fs.chmod(preview, 0o600); }
    }
  }
  await fs.writeFile(file + ".json", JSON.stringify(metadata), { mode: 0o600 });
  prepared++;
  if (prepared % 25 === 0) console.log(`Prepared previews for ${prepared} images.`);
}
console.log(`Prepared ${prepared} images; original files preserved.`);
