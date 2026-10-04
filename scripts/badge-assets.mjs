// Deriva de public/badge/plantilla.png dos piezas livianas para /badge:
//  - public/badge/plantilla-vista.webp: vista del hero (540x675)
//  - public/og-badge.jpg: imagen para compartir el enlace /badge (1200x630)
// Uso: node scripts/badge-assets.mjs
import sharp from "sharp";

const plantilla = "public/badge/plantilla.png";

await sharp(plantilla).resize(540, 675).webp({ quality: 82 }).toFile("public/badge/plantilla-vista.webp");

const alto = 540;
const ancho = Math.round((alto * 1080) / 1350);
const badge = await sharp(plantilla).resize(ancho, alto).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#3B99D8" } })
  .composite([{ input: badge, left: Math.round((1200 - ancho) / 2), top: 45 }])
  .jpeg({ quality: 88 })
  .toFile("public/og-badge.jpg");
