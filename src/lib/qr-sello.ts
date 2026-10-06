// Interpreta el texto de un QR leído dentro del pasaporte. Solo acepta URLs del
// mismo origen con ruta /stamp/<standId> y una clave `k` cuyo SHA-256 coincide
// con el de sellos.json. Cualquier otra cosa es "No encontramos este destino".
import { claveValida } from "./pasaporte";

export interface LecturaSello {
  standId: string;
  /** Ruta + query a la que navegar, siempre del mismo origen. */
  destino: string;
}

export async function interpretarQr(
  texto: string,
  origen: string,
  hashes: Readonly<Record<string, string>>,
): Promise<LecturaSello | null> {
  let url: URL;
  try {
    url = new URL(texto.trim());
  } catch {
    return null;
  }
  if (url.origin !== origen) return null;
  const standId = url.pathname.match(/^\/stamp\/([a-z0-9-]+)\/?$/)?.[1];
  if (!standId || !Object.hasOwn(hashes, standId)) return null;
  const k = url.searchParams.get("k");
  if (!(await claveValida(k, hashes[standId]))) return null;
  return { standId, destino: `/stamp/${standId}?k=${encodeURIComponent(k!)}` };
}
