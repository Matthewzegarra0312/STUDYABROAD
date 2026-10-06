// Pase personal (/pase): descifra public/pases/<id>.json con el código del correo.
// Mismo esquema que saf-pases (src/web-pases.ts): UNA pasada de PBKDF2-SHA256
// sobre el código normalizado, sal pública del evento, 512 bits: los primeros
// 256 son el id del archivo (hex) y los últimos 256 la clave AES-GCM.
// El código tiene ~50 bits: por eso PBKDF2 con muchas iteraciones y no un hash rápido.

export const SAL = "study-abroad-fest-2026/pase/v1";
export const ITERACIONES = 300_000;

/** Lo que trae el archivo descifrado (claves cortas, igual que saf-pases). */
export interface ContenidoPase {
  /** Nombre ya ajustado al pase. */
  n: string;
  /** Tamaño de letra del nombre (27 o 22). */
  px: number;
  /** Espacio entre la tarjeta y el pie. */
  pie: number;
  /** qr_code_url de Luma, tal cual. */
  q: string;
}

interface ArchivoPase {
  v: number;
  iv: string;
  ct: string;
}

const ALFABETO_VALIDO = /^[0-9A-HJKMNP-TV-Z]{10}$/;

/**
 * Lo que escribe una persona: mayúsculas, sin espacios ni guiones, y los
 * ambiguos de Crockford (O a 0, I y L a 1). Devuelve XXXXX-XXXXX o null.
 */
export function normalizarCodigo(entrada: string): string | null {
  const limpio = entrada
    .toUpperCase()
    .replace(/[\s-]+/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (!ALFABETO_VALIDO.test(limpio)) return null;
  return `${limpio.slice(0, 5)}-${limpio.slice(5)}`;
}

const texto = new TextEncoder();
const hex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
function deBase64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function derivar(codigo: string, iteraciones = ITERACIONES): Promise<{ id: string; clave: CryptoKey }> {
  const base = await crypto.subtle.importKey("raw", texto.encode(codigo), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: texto.encode(SAL), iterations: iteraciones }, base, 512),
  );
  const clave = await crypto.subtle.importKey("raw", bits.slice(32), "AES-GCM", false, ["decrypt"]);
  return { id: hex(bits.slice(0, 32)), clave };
}

export async function descifrar(clave: CryptoKey, a: ArchivoPase): Promise<ContenidoPase> {
  const claro = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deBase64(a.iv) }, clave, deBase64(a.ct));
  return JSON.parse(new TextDecoder().decode(claro)) as ContenidoPase;
}

/**
 * Código ya normalizado a contenido del pase, o null si el código no es válido.
 * No distingue "no existe" de "no descifra": ninguna pista sobre qué códigos existen.
 */
export async function abrirPase(
  codigo: string,
  o: { iteraciones?: number; pedir?: (url: string) => Promise<Response> } = {},
): Promise<ContenidoPase | null> {
  const { id, clave } = await derivar(codigo, o.iteraciones);
  const pedir = o.pedir ?? ((url: string) => fetch(url, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" }));
  try {
    const r = await pedir(`/pases/${id}.json`);
    if (!r.ok) return null;
    const contenido = await descifrar(clave, (await r.json()) as ArchivoPase);
    return typeof contenido.n === "string" && typeof contenido.q === "string" ? contenido : null;
  } catch {
    return null;
  }
}
