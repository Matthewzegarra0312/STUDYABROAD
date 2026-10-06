// Interpreta el texto de un QR leído dentro del pasaporte. Acepta una URL http(s)
// con ruta /stamp/<standId> y una clave `k` cuyo SHA-256 coincide con el de
// sellos.json. Cualquier otra cosa es "No encontramos este destino".
//
// No se compara el origen: los QR impresos llevan el dominio de producción y la
// persona puede estar en un preview, un alias o un túnel de pruebas. Es seguro
// porque `destino` es siempre una ruta relativa: se navega dentro del origen
// actual, nunca a la URL que trae el QR, y la clave se valida por su hash.
import { claveValida } from "./pasaporte";

export interface LecturaSello {
  standId: string;
  /** Ruta + query a la que navegar, siempre relativa al origen actual. */
  destino: string;
}

export async function interpretarQr(
  texto: string,
  hashes: Readonly<Record<string, string>>,
): Promise<LecturaSello | null> {
  let url: URL;
  try {
    url = new URL(texto.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const standId = url.pathname.match(/^\/stamp\/([a-z0-9-]+)\/?$/)?.[1];
  if (!standId || !Object.hasOwn(hashes, standId)) return null;
  const k = url.searchParams.get("k");
  if (!(await claveValida(k, hashes[standId]))) return null;
  return { standId, destino: `/stamp/${standId}?k=${encodeURIComponent(k!)}` };
}
