const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.join(__dirname, "images");
const EXTS = [".png", ".jpg", ".jpeg"];

// Quality settings — AVIF quality 60 ≈ WebP quality 80 ≈ JPEG quality 90 visually
const AVIF_QUALITY = 60;
const WEBP_QUALITY = 80;

async function convert(file) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTS.includes(ext)) return;

  const src = path.join(IMAGES_DIR, file);
  const base = path.join(IMAGES_DIR, path.basename(file, ext));

  const avifOut = base + ".avif";
  const webpOut = base + ".webp";

  const srcStat = fs.statSync(src);

  try {
    // AVIF
    if (!fs.existsSync(avifOut)) {
      await sharp(src)
        .avif({ quality: AVIF_QUALITY, effort: 6 })
        .toFile(avifOut);
      const avifStat = fs.statSync(avifOut);
      console.log(`AVIF  ${file.padEnd(60)} ${kb(srcStat)} → ${kb(avifStat)} (${savings(srcStat, avifStat)}% smaller)`);
    }

    // WebP (fallback for browsers without AVIF)
    if (!fs.existsSync(webpOut)) {
      await sharp(src)
        .webp({ quality: WEBP_QUALITY })
        .toFile(webpOut);
      const webpStat = fs.statSync(webpOut);
      console.log(`WebP  ${file.padEnd(60)} ${kb(srcStat)} → ${kb(webpStat)} (${savings(srcStat, webpStat)}% smaller)`);
    }
  } catch (e) {
    console.error(`SKIP  ${file}  — ${e.message}`);
  }
}

const kb = s => (s.size / 1024).toFixed(0) + " KB";
const savings = (src, out) => (((src.size - out.size) / src.size) * 100).toFixed(0);

(async () => {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return EXTS.includes(ext);
  });

  console.log(`Converting ${files.length} images...\n`);
  for (const f of files) await convert(f);
  console.log("\nDone. Use <picture> tags to serve AVIF with WebP/original fallback.");
})();
