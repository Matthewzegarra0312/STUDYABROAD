// Genera src/data/mesa.json con el hash PBKDF2 del PIN de 4 dígitos de la mesa
// de canje (PROMPT-PASAPORTE.md, 3.7). El PIN en claro nunca se guarda.
//
// Uso:
//   npm run pin-mesa -- XXXX
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { crearDatosMesa, pinValido } from "../src/lib/mesa";

const pin = process.argv[2] ?? "";
if (!pinValido(pin)) {
  console.error("Uso: npm run pin-mesa -- <PIN de 4 dígitos>");
  process.exit(1);
}

const datos = await crearDatosMesa(pin);
await writeFile(path.resolve("src/data/mesa.json"), `${JSON.stringify(datos, null, 2)}\n`);
console.log("Listo: src/data/mesa.json actualizado. Comparte el PIN solo con el equipo de la mesa.");
