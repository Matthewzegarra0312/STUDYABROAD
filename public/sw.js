// Service worker del pasaporte digital (PROMPT-PASAPORTE.md, 3.8). Mínimo, para
// que /pasaporte y /stamp/<id> funcionen con mala señal o sin conexión.
//
// Se registra SOLO desde /pasaporte y /stamp/* (src/lib/sw-registro.ts), que le
// pasan la lista de páginas a guardar. Estrategia:
//   - páginas del pasaporte: caché primero, y se actualizan en segundo plano
//     (antes de guardar la página nueva se guardan sus recursos, para que nunca
//     quede una página nueva con recursos que no están en caché);
//   - recursos estáticos con hash (/_astro/, /pase-assets/, íconos): caché primero;
//   - todo lo demás pasa directo a la red: /api/*, /mi-calendario, /canje, /pase,
//     /pases/* y el resto del sitio NO se guardan nunca.
//
// Para invalidar todo lo guardado, sube VERSION.
const VERSION = "saf-pasaporte-v1";

const ES_PAGINA = /^\/(?:pasaporte|stamp\/[a-z0-9-]+)\/?$/;
const ES_RECURSO = /^\/(?:_astro\/|pase-assets\/|favicon|apple-touch-icon)/;
const RECURSO_EN_TEXTO = /(?:src|href)=["'](\/(?:_astro|pase-assets)\/[^"'\s>]+)["']|["'(](\/_astro\/[^"'()\s>]+)/g;
const URL_EN_CSS = /url\(\s*["']?([^"')\s]+)["']?\s*\)/g;
// Módulos JS: importan otros con rutas relativas ("./chunk.abc.js") o absolutas.
const IMPORT_EN_JS = /["'`]((?:\.{1,2}\/|\/_astro\/)[^"'`\s]+\.(?:js|css|woff2?|png|jpe?g|webp|svg))["'`]/g;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(nombres.filter((n) => n.startsWith("saf-pasaporte-") && n !== VERSION).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

/** Recursos que una página o una hoja de estilos pide, como rutas del mismo origen. */
function recursosDe(texto, base) {
  const rutas = new Set();
  for (const m of texto.matchAll(RECURSO_EN_TEXTO)) rutas.add(m[1] || m[2]);
  for (const m of texto.matchAll(URL_EN_CSS)) {
    try {
      const u = new URL(m[1], base);
      if (u.origin === self.location.origin && ES_RECURSO.test(u.pathname)) rutas.add(u.pathname);
    } catch {
      /* url inválida: se ignora */
    }
  }
  return [...rutas];
}

async function guardarRecurso(cache, ruta, profundidad = 0) {
  if (await cache.match(ruta)) return;
  try {
    const r = await fetch(ruta);
    if (!r.ok) return;
    await cache.put(ruta, r.clone());
    // Hojas de estilo y módulos JS traen fuentes, imágenes y otros módulos: se guardan también.
    const tipo = r.headers.get("content-type") || "";
    const base = new URL(ruta, self.location.origin);
    if (profundidad < 4 && tipo.includes("text/css")) {
      const css = await r.text();
      await Promise.all(recursosDe(css, base).map((x) => guardarRecurso(cache, x, profundidad + 1)));
    } else if (profundidad < 4 && /javascript/.test(tipo)) {
      const js = await r.text();
      const hijos = new Set();
      for (const m of js.matchAll(IMPORT_EN_JS)) {
        try {
          const u = new URL(m[1], base);
          if (u.origin === self.location.origin && ES_RECURSO.test(u.pathname)) hijos.add(u.pathname);
        } catch {
          /* ruta inválida: se ignora */
        }
      }
      await Promise.all([...hijos].map((x) => guardarRecurso(cache, x, profundidad + 1)));
    }
  } catch {
    /* sin conexión: se intenta de nuevo la próxima vez */
  }
}

/** Guarda la página y todo lo que usa. La página se escribe al final. */
async function guardarPagina(ruta) {
  const cache = await caches.open(VERSION);
  const r = await fetch(ruta, { cache: "reload" });
  if (!r.ok) return;
  const html = await r.clone().text();
  await Promise.all(recursosDe(html, new URL(ruta, self.location.origin)).map((x) => guardarRecurso(cache, x)));
  await cache.put(ruta, r);
}

self.addEventListener("message", (e) => {
  if (e.data?.tipo !== "precachear" || !Array.isArray(e.data.urls)) return;
  const paginas = e.data.urls.filter((u) => typeof u === "string" && ES_PAGINA.test(u));
  e.waitUntil(Promise.all(paginas.map((u) => guardarPagina(u).catch(() => undefined))));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (ES_PAGINA.test(url.pathname)) {
    // /stamp/<id>?k=... se guarda y se sirve sin la query: la clave no entra al caché.
    const ruta = url.pathname;
    e.respondWith(
      (async () => {
        const cache = await caches.open(VERSION);
        const guardada = await cache.match(ruta);
        const actualizar = guardarPagina(ruta).catch(() => undefined);
        if (guardada) {
          e.waitUntil(actualizar);
          return guardada;
        }
        try {
          const r = await fetch(req);
          e.waitUntil(actualizar);
          return r;
        } catch {
          return (await cache.match(ruta)) || Response.error();
        }
      })(),
    );
    return;
  }

  if (ES_RECURSO.test(url.pathname)) {
    e.respondWith(
      (async () => {
        const cache = await caches.open(VERSION);
        const guardada = await cache.match(url.pathname);
        if (guardada) return guardada;
        const r = await fetch(req);
        if (r.ok) e.waitUntil(cache.put(url.pathname, r.clone()));
        return r;
      })(),
    );
  }
  // Cualquier otra ruta no se intercepta: va directo a la red.
});
