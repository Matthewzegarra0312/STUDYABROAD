#!/usr/bin/env node
// /pase/<codigo> (saf-pases): la página es UNA sola, prerenderizada en
// /pase/index.html, y el código se lee en el navegador. @astrojs/vercel
// escribe .vercel/output/config.json (Build Output API v3), así que un
// "rewrites" en vercel.json no se aplicaría; y sin esta regla, la última
// ruta del adaptador (^/.*$ → _render, 404) mandaría /pase/<codigo> a una
// función, que sí registra la ruta. Este script agrega, antes de
// "handle: filesystem":
//   1. cabeceras de privacidad para /pase y /pases (noindex, sin referrer,
//      sin caché compartida del HTML);
//   2. CORS para las fuentes que usa el correo (/pase-assets/fuentes);
//   3. la reescritura estática /pase/<codigo> → /pase/index.html.
// Mismo mecanismo que scripts/bloquear-imprimir-en-vercel.mjs. A diferencia
// de ese, corre siempre que exista el config.json (también en local).
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const RUTA_CONFIG = path.resolve(".vercel/output/config.json");
if (!existsSync(RUTA_CONFIG)) {
  console.log("rutas-pase: no hay .vercel/output/config.json, nada que hacer.");
  process.exit(0);
}

const config = JSON.parse(await readFile(RUTA_CONFIG, "utf-8"));

export const REGLAS_PASE = [
  {
    src: "^/pase(?:/.*)?$",
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "private, no-store, max-age=0",
    },
    continue: true,
  },
  {
    src: "^/pases/[0-9a-f]{64}\\.json$",
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "public, max-age=300",
    },
    continue: true,
  },
  // Pasaporte digital: páginas estáticas sin analítica. Sin Cache-Control privado
  // a propósito: el service worker las guarda para usarlas sin conexión.
  {
    src: "^/(?:pasaporte|stamp/[a-z0-9-]+)/?$",
    headers: { "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" },
    continue: true,
  },
  // El service worker se revalida siempre, para que una versión nueva se aplique.
  {
    src: "^/sw\\.js$",
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
    continue: true,
  },
  // Fuentes del correo (@font-face en templates/correo.html de saf-pases):
  // los clientes de correo web las piden desde otro origen.
  {
    src: "^/pase-assets/fuentes/[a-z0-9-]+\\.woff2$",
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=604800" },
    continue: true,
  },
  { src: "^/pase/[^/]+/?$", dest: "/pase/index.html" },
];

const indiceFilesystem = config.routes?.findIndex((r) => r.handle === "filesystem") ?? -1;
if (indiceFilesystem === -1) {
  throw new Error(
    `No se encontró la regla "handle: filesystem" en ${RUTA_CONFIG}; revisa si @astrojs/vercel cambió su formato de salida.`,
  );
}

const nuevas = REGLAS_PASE.filter((regla) => !config.routes.some((r) => r.src === regla.src));
config.routes.splice(indiceFilesystem, 0, ...nuevas);
await writeFile(RUTA_CONFIG, JSON.stringify(config, null, 2));

console.log(`✓ /pase/<codigo> se sirve desde /pase/index.html, con cabeceras de privacidad (${nuevas.length} reglas nuevas).`);
