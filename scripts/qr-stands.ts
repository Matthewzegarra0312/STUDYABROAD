// Pasaporte digital (PROMPT-PASAPORTE.md, sección 3.3): genera una clave
// aleatoria por stand y los QR para imprimir.
//
//   - src/data/sellos.json   solo el SHA-256 (hex) de cada clave. Este sí se sube.
//   - qr-stands/             PNG de 1200 px y SVG por stand, más claves.txt con las
//                            URLs completas. NUNCA se sube al repo (.gitignore).
//
// Uso:
//   npm run qr-stands                       (usa https://studyabroad.leadutp.org)
//   npm run qr-stands -- --base-url https://otro.dominio
//   npm run qr-stands -- --force            (regenera: invalida los QR ya impresos)
//
// Limitación asumida: un QR fotografiado se puede compartir. El control real
// sigue siendo la mesa de canje.
import { randomInt } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { chromium } from "playwright";
import { gates } from "../src/data/schedule";
import stands from "../src/data/stands";
import { ALFABETO_CODIGO } from "../src/server/alfabetoCodigo";
import { sha256Hex } from "../src/lib/hash";

const BASE_URL_POR_DEFECTO = "https://studyabroad.leadutp.org";
const LARGO_CLAVE = 16;
const SELLOS_JSON = path.resolve("src/data/sellos.json");
const CARPETA = path.resolve("qr-stands");

const args = process.argv.slice(2);
const force = args.includes("--force");
const iBase = args.indexOf("--base-url");
const baseUrl = (iBase >= 0 ? args[iBase + 1] : BASE_URL_POR_DEFECTO).replace(/\/+$/, "");

if (existsSync(SELLOS_JSON) && !force) {
  console.error(
    "Ya existe src/data/sellos.json. Volver a correr este script genera claves nuevas e INVALIDA los QR ya impresos.\n" +
      "Si es lo que quieres, corre: npm run qr-stands -- --force",
  );
  process.exit(1);
}

const generarClave = (): string => Array.from({ length: LARGO_CLAVE }, () => ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)]).join("");
const escapar = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Lámina imprimible: QR en negro sobre blanco con zona de silencio, nombre del stand y "Puerta N". */
function lamina(qrSvgTexto: string, nombre: string, puerta: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="#FFFFFF"/>
  ${qrSvgTexto.replace(/<svg[^>]*?(viewBox="[^"]*")[^>]*>/, '<svg x="100" y="100" width="1000" height="1000" $1 shape-rendering="crispEdges">')}
  <text x="600" y="1200" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="84" fill="#1D2152">${escapar(nombre)}</text>
  <text x="600" y="1310" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="64" fill="#6258BB">Puerta ${puerta}</text>
  <text x="600" y="1400" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#4A507C">Study Abroad Fest 2026 · Escanea desde tu pasaporte</text>
</svg>`;
}

async function main(): Promise<void> {
  await mkdir(CARPETA, { recursive: true });
  const hashes: Record<string, string> = {};
  const lineas: string[] = [];
  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage({ viewport: { width: 1200, height: 1500 } });
    for (const g of gates) {
      const nombre = stands.find((s) => s.id === g.standId)?.nombre ?? g.name;
      const clave = generarClave();
      const url = `${baseUrl}/stamp/${g.standId}?k=${clave}`;
      hashes[g.standId] = await sha256Hex(clave);
      lineas.push(`Puerta ${g.n} · ${nombre}\n${url}\n`);

      const qr = await QRCode.toString(url, { type: "svg", margin: 4, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#FFFFFF" } });
      const svg = lamina(qr, nombre, g.n);
      await writeFile(path.join(CARPETA, `${g.n}-${g.standId}.svg`), svg);
      await pagina.setContent(`<body style="margin:0">${svg}</body>`);
      await pagina.screenshot({ path: path.join(CARPETA, `${g.n}-${g.standId}.png`), clip: { x: 0, y: 0, width: 1200, height: 1500 } });
    }
  } finally {
    await navegador.close();
  }
  await writeFile(path.join(CARPETA, "claves.txt"), lineas.join("\n"));
  await writeFile(SELLOS_JSON, `${JSON.stringify(hashes, null, 2)}\n`);
  console.log(`Listo: ${gates.length} QR en qr-stands/ y hashes en src/data/sellos.json.`);
  console.log("qr-stands/ NO se sube al repo. Imprime cada QR a 10 cm de lado como mínimo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
