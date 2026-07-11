import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";

const publicDir = path.resolve(import.meta.dirname, "..", "public");
const iconsDir = path.join(publicDir, "icons");
const svg = readFileSync(path.join(publicDir, "icon-source.svg"));

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(iconsDir, file));
  console.log(`generated ${file}`);
}

// Maskable icon: keep artwork inside the safe zone (padding ~20%)
const maskableSize = 512;
const padded = Math.round(maskableSize * 0.7);
await sharp(svg, { density: 384 })
  .resize(padded, padded)
  .extend({
    top: Math.round((maskableSize - padded) / 2),
    bottom: Math.round((maskableSize - padded) / 2),
    left: Math.round((maskableSize - padded) / 2),
    right: Math.round((maskableSize - padded) / 2),
    background: "#15803d",
  })
  .png()
  .toFile(path.join(iconsDir, "icon-512-maskable.png"));
console.log("generated icon-512-maskable.png");

await sharp(svg, { density: 384 })
  .resize(32, 32)
  .png()
  .toFile(path.join(publicDir, "favicon-32.png"));
console.log("generated favicon-32.png");
