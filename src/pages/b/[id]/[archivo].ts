import type { APIRoute } from "astro";
import { ARCHIVOS_BADGE, esArchivoBadge, leerImagenBadge } from "../../../server/badges";

export const prerender = false;

/**
 * Sirve badge.png y preview.jpg de un badge compartido. El store de Blob es
 * privado, así que la página /b/<id> y el rastreador de LinkedIn piden las
 * imágenes aquí. Los badges no cambian (nunca se sobrescriben), por eso el
 * caché es largo.
 */
export const GET: APIRoute = async ({ params }) => {
  const { id = "", archivo = "" } = params;
  if (!esArchivoBadge(archivo)) return new Response("No encontrado", { status: 404 });

  let imagen: ReadableStream<Uint8Array> | null;
  try {
    imagen = await leerImagenBadge(id, archivo);
  } catch (e) {
    console.error("[badge] No se pudo leer la imagen de Blob:", e instanceof Error ? e.message : e);
    return new Response("No disponible", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!imagen) return new Response("No encontrado", { status: 404, headers: { "Cache-Control": "public, s-maxage=60" } });

  return new Response(imagen, {
    headers: {
      "Content-Type": ARCHIVOS_BADGE[archivo],
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
    },
  });
};
