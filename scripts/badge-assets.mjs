// Deriva de design/badge/plantilla-original.png las dos piezas que se publican:
//  - public/badge/plantilla.jpg: la que dibuja el canvas (1080x1350, calidad 90)
//  - public/og-badge.jpg: imagen para compartir el enlace /badge (1200x630)
// Los originales viven en design/badge/ y no se publican.
// Uso: node scripts/badge-assets.mjs
import sharp from "sharp";

const original = "design/badge/plantilla-original.png";

await sharp(original).jpeg({ quality: 90 }).toFile("public/badge/plantilla.jpg");

const alto = 540;
const ancho = Math.round((alto * 1080) / 1350);
const badge = await sharp(original).resize(ancho, alto).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#3B99D8" } })
  .composite([{ input: badge, left: Math.round((1200 - ancho) / 2), top: 45 }])
  .jpeg({ quality: 88 })
  .toFile("public/og-badge.jpg");

// Fondo de /badge: la fuente es de 1200x1800, así que se reescala una vez a
// 2400 px con Lanczos y un poco de nitidez (mejor que el estiramiento del
// navegador). Sale a src/assets/badge/ para que Astro lo optimice.
await sharp("design/badge/fondo-original.png")
  .resize({ width: 1920, kernel: "lanczos3", withoutEnlargement: false })
  .sharpen({ sigma: 0.8 })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile("src/assets/badge/fondo-badge.jpg");
