// Hashes SHA-256 de las claves de los QR de cada stand. Las claves en claro
// nunca van en el repo: solo están en las URLs impresas (qr-stands/, ignorado).
// Se generan con `npm run qr-stands`.
import { z } from "zod";
import { gates } from "./schedule";
import sellosJson from "./sellos.json";

const HashSchema = z.string().regex(/^[0-9a-f]{64}$/, "Se esperaba un SHA-256 en hex");

/** standId -> SHA-256(clave). Valida que haya uno por cada stand de `gates` y ninguno ajeno. */
export function validarSellos(crudo: unknown): Record<string, string> {
  const hashes = z.record(z.string(), HashSchema).parse(crudo);
  const ids = gates.map((g) => g.standId);
  for (const id of ids) {
    if (!hashes[id]) throw new Error(`sellos.json: falta el hash del stand "${id}"`);
  }
  for (const id of Object.keys(hashes)) {
    if (!ids.includes(id)) throw new Error(`sellos.json: "${id}" no es un stand de gates`);
  }
  return hashes;
}

export const sellosHash = validarSellos(sellosJson);
