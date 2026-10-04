// Deriva de design/badge/plantilla-original.png las dos piezas que se publican:
//  - public/badge/plantilla.jpg: la que dibuja el canvas (1080x1350, calidad 90)
//  - public/og-badge.jpg: imagen para compartir el enlace /badge (1200x630)
// El PNG original vive en design/badge/ y no se publica.
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
