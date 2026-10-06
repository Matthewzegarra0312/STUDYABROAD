// Exporta las entregas de la mesa de canje (las que se guardan en Upstash cuando el
// voluntario marca "Código entregado") a un CSV que abre Excel.
//
// Uso (necesita UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN, en .env o en el entorno):
//   npm run entregas                 escribe entregas.csv en la raíz (ignorado por git)
//   npm run entregas -- --borrar     exporta y luego BORRA las entregas de Redis
//                                    (para después del evento: contiene nombres de asistentes)
import { writeFile } from "node:fs/promises";
import path from "node:path";

try {
  process.loadEnvFile();
} catch {
  // Sin .env local: se usa lo que haya en el entorno.
}

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error("Faltan UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN (en .env o en el entorno).");
  process.exit(1);
}

const { gates } = await import("../src/data/schedule");
const { entregasACsv } = await import("../src/server/entregas");
const { listarEntregas, borrarEntregas } = await import("../src/server/redis");

const entregas = await listarEntregas();
if (!entregas) {
  console.error("No se pudo conectar a Redis.");
  process.exit(1);
}

const destino = path.resolve("entregas.csv");
await writeFile(destino, entregasACsv(entregas, gates.map((g) => g.standId)));
console.log(`${entregas.length} entregas exportadas a ${destino}`);

if (process.argv.includes("--borrar")) {
  await borrarEntregas();
  console.log("Entregas borradas de Redis.");
}
