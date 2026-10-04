import type { APIRoute } from "astro";
import { blobDisponible, generarIdBadge, guardarBadge, MAX_CUERPO_BYTES, SUBIDAS_POR_HORA, validarSubida } from "../../server/badges";
import { subidasBadgeSuperadas } from "../../server/redis";

export const prerender = false;

type CodigoError = "formato" | "tipo" | "medidas" | "tamano" | "limite" | "no-disponible" | "servidor";

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function error(status: number, codigo: CodigoError): Response {
  return json(status, { error: codigo });
}

/**
 * Recibe el badge (PNG 1080x1350) y su vista previa (JPG 1200x627), los valida
 * y los guarda en Vercel Blob bajo un id aleatorio. Responde { id }. No recibe
 * ni guarda nombre, mood ni ningún dato personal aparte de las dos imágenes.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const largo = Number(request.headers.get("content-length"));
  if (Number.isFinite(largo) && largo > MAX_CUERPO_BYTES) return error(413, "tamano");

  // Límite por IP (10 por hora). clientAddress puede no estar disponible
  // según el adaptador; nunca debe tumbar la petición.
  let ip = "desconocida";
  try {
    if (typeof clientAddress === "string" && clientAddress.length > 0) ip = clientAddress;
  } catch {
    // el adaptador no expone clientAddress en este contexto
  }
  if (await subidasBadgeSuperadas(ip, SUBIDAS_POR_HORA)) return error(429, "limite");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "formato");
  }

  const validacion = await validarSubida(form);
  if (!validacion.ok) return error(validacion.error === "tamano" ? 413 : 400, validacion.error);

  if (!blobDisponible()) {
    console.warn("[badge] Falta BLOB_READ_WRITE_TOKEN: no se puede guardar el badge.");
    return error(503, "no-disponible");
  }

  const id = generarIdBadge();
  try {
    await guardarBadge(id, validacion.valor);
  } catch (e) {
    console.error("[badge] No se pudo guardar el badge en Blob:", e instanceof Error ? e.message : e);
    return error(502, "servidor");
  }
  return json(200, { id });
};
