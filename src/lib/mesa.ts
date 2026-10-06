// PIN corto del equipo para la mesa de canje (PROMPT-PASAPORTE.md, 3.7).
// Solo se guarda su hash PBKDF2-SHA256 con sal propia en src/data/mesa.json.
// Limitación asumida: 4 dígitos se pueden forzar sin conexión. Es aceptable
// porque el PIN solo protege una marca visual, no el calendario.

export const ITERACIONES_PIN = 300_000;
export const MAX_FALLOS_PIN = 5;
export const BLOQUEO_PIN_MS = 60_000;

export interface DatosMesa {
  /** Sal aleatoria en hex. */
  sal: string;
  iteraciones: number;
  /** PBKDF2-SHA256 de 256 bits, en hex. */
  hash: string;
}

const texto = new TextEncoder();
const aHex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
function deHex(s: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(s.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export const pinValido = (pin: string): boolean => /^\d{4}$/.test(pin);

export async function hashPin(pin: string, sal: string, iteraciones: number): Promise<string> {
  const base = await crypto.subtle.importKey("raw", texto.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: deHex(sal), iterations: iteraciones }, base, 256);
  return aHex(new Uint8Array(bits));
}

export async function crearDatosMesa(pin: string, iteraciones = ITERACIONES_PIN): Promise<DatosMesa> {
  const sal = aHex(crypto.getRandomValues(new Uint8Array(16)));
  return { sal, iteraciones, hash: await hashPin(pin, sal, iteraciones) };
}

export async function verificarPin(pin: string, mesa: DatosMesa): Promise<boolean> {
  if (!pinValido(pin)) return false;
  return (await hashPin(pin, mesa.sal, mesa.iteraciones)) === mesa.hash;
}

/**
 * Bloqueo en pantalla: tras MAX_FALLOS_PIN fallos seguidos, BLOQUEO_PIN_MS sin
 * aceptar intentos. Lógica pura con reloj inyectado para probarla.
 */
export interface EstadoBloqueo {
  fallos: number;
  bloqueadoHasta: number;
}

export const sinBloqueo = (): EstadoBloqueo => ({ fallos: 0, bloqueadoHasta: 0 });

export const segundosDeBloqueo = (e: EstadoBloqueo, ahora: number): number => Math.max(0, Math.ceil((e.bloqueadoHasta - ahora) / 1000));

export function registrarFallo(e: EstadoBloqueo, ahora: number): EstadoBloqueo {
  const fallos = e.fallos + 1;
  return fallos >= MAX_FALLOS_PIN ? { fallos: 0, bloqueadoHasta: ahora + BLOQUEO_PIN_MS } : { fallos, bloqueadoHasta: e.bloqueadoHasta };
}
