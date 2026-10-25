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
  const swapsAxes = [5, 6, 7, 8].includes(info.orientation);
  const metadata = { contentType: `image/${info.format === "jpeg" ? "jpeg" : info.format}`, width: swapsAxes ? info.height : info.width, height: swapsAxes ? info.width : info.height, normalizedOrientation: info.orientation || 1 };
  let previous = {};
  try { previous = JSON.parse(await fs.readFile(file + '.json', 'utf8')); } catch { /* First preparation. */ }
  const refreshOrientation = (info.orientation || 1) !== (previous.normalizedOrientation || 1);
  let animatedPng = false;
  if (info.format === 'png') {
    const bytes = await fs.readFile(file);
    for (let offset = 8; offset + 12 <= bytes.length;) {
      if (bytes.toString('ascii', offset + 4, offset + 8) === 'acTL') { animatedPng = true; break; }
      offset += 12 + bytes.readUInt32BE(offset);
    }
  }
  if (!animatedPng && info.format !== "gif" && (info.pages || 1) === 1) {
    // Keep a WebP at native resolution so high-DPR screens do not select the
    // original PNG/JPEG from the final srcset descriptor. Originals stay intact.
    if (["png", "jpeg"].includes(info.format)) {
      const full = `${file}.full.webp`;
      let exists = false;
      try { await fs.access(full); exists = true; } catch { /* New derivative. */ }
      if (!exists || refreshOrientation) { await sharp(file).rotate().webp({ quality: 88 }).toFile(full); await fs.chmod(full, 0o600); }
    }
    for (const width of [320, 640, 1280, 1920]) {
      if (width >= metadata.width) continue;
      const preview = `${file}.${width}.webp`;
      let exists = false;
      try { await fs.access(preview); exists = true; } catch { /* New derivative. */ }
      if (!exists || refreshOrientation) { await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 88 }).toFile(preview); await fs.chmod(preview, 0o600); }
    }
  }
  await fs.writeFile(file + ".json", JSON.stringify(metadata), { mode: 0o600 });
  prepared++;
  if (prepared % 25 === 0) console.log(`Prepared previews for ${prepared} images.`);
}
console.log(`Prepared ${prepared} images; original files preserved.`);
