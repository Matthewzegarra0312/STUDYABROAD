// @ts-check
import { existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// `astro dev`/`astro build` nunca cargan `.env` en `process.env` por su
// cuenta (a diferencia de Vercel, que inyecta sus variables de entorno
// directamente): solo exponen las que empiezan con `PUBLIC_` a
// `import.meta.env`. El código de servidor de este proyecto (CANJE_SECRET,
// Upstash, SITE_URL) lee `process.env` directo, así que sin esto nunca
// veía nada de `.env` en local. Mismo mecanismo nativo de Node que ya usan
// los scripts (ver scripts/codigos.ts); en Vercel simplemente no hay
// `.env` que cargar y esto no hace nada.
try {
  process.loadEnvFile();
} catch {
  // Sin .env local (p. ej. en Vercel o en un clon nuevo sin configurar).
}

// Ruta relativa a la raíz del proyecto (astro.config.mjs vive ahí).
const PDF_PROTEGIDO = './private/calendario-becas-saf2026.pdf';
const pdfProtegidoDisponible = existsSync(new URL(PDF_PROTEGIDO, import.meta.url));
if (!pdfProtegidoDisponible) {
  console.warn(
    '[study-abroad-fest] Sin private/calendario-becas-saf2026.pdf en esta build. El sitio se despliega igual; GET /api/descarga/pdf responde 404 hasta generar el archivo en la máquina que construye (npm run pdf).',
  );
}

// https://astro.build/config
export default defineConfig({
  // Dominio final todavía pendiente (PLAN.md, sección 8): sin SITE_URL,
  // las URL absolutas (canonical, Open Graph) se degradan a rutas
  // relativas en vez de inventar un dominio (CLAUDE.md, regla 1). Se
  // activan solas en cuanto se defina SITE_URL en Vercel (Fase 7).
  site: process.env.SITE_URL || undefined,

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel({
    // El PDF protegido vive en private/ (nunca en public/, CLAUDE.md
    // regla 10) y por eso no se incluye por defecto en el bundle de la
    // función; GET /api/descarga/pdf lo necesita en tiempo de ejecución
    // (PLAN.md, Fase 5). private/ está en .gitignore, así que un deploy
    // desde Git (Vercel) no tiene el archivo. @astrojs/vercel hace
    // realpath de cada includeFiles y aborta el build si falta; solo se
    // incluye cuando existe (build local después de `npm run pdf`).
    includeFiles: pdfProtegidoDisponible ? [PDF_PROTEGIDO] : []
  })
});
