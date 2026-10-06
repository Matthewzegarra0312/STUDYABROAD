// Pasaporte digital: estado guardado en el navegador (localStorage), sin servidor.
// Lógica pura: sin Astro y sin DOM salvo un `Storage` inyectable para probar.
// Se guarda solo nombre, número, sellos y marca de canje. Nunca el código de
// 10 caracteres, el correo ni el QR de Luma.
import { z } from "zod";
import { ALFABETO_CODIGO } from "../server/alfabetoCodigo";
import { sha256, sha256Hex } from "./hash";

export const CLAVE_PASAPORTE = "study_abroad_passport";
export const CLAVE_PENDIENTE = "study_abroad_pending";

const PasaporteSchema = z.object({
  v: z.literal(1),
  nombre: z.string().min(1),
  numero: z.string().min(1),
  sellos: z.record(z.string(), z.string()),
  canjeadoEl: z.string().optional(),
});
export type Pasaporte = z.infer<typeof PasaporteSchema>;

const PendienteSchema = z.object({ id: z.string().min(1), ts: z.string().min(1) });
export type Pendiente = z.infer<typeof PendienteSchema>;

/** Lo mínimo que usamos de `Storage`; permite inyectar uno falso en las pruebas. */
export interface Almacen {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/**
 * Almacén resistente: si localStorage no existe o lanza (modo privado,
 * bloqueado), sigue funcionando en memoria y `persistente` queda en false para
 * que la página muestre el aviso.
 */
export interface AlmacenSeguro extends Almacen {
  readonly persistente: boolean;
}

export function crearAlmacen(obtener: () => Almacen | null | undefined): AlmacenSeguro {
  const memoria = new Map<string, string>();
  let real: Almacen | null = null;
  let persistente = true;
  try {
    real = obtener() ?? null;
    if (!real) persistente = false;
  } catch {
    persistente = false;
  }
  return {
    get persistente() {
      return persistente;
    },
    getItem(k) {
      if (real && persistente) {
        try {
          return real.getItem(k);
        } catch {
          persistente = false;
        }
      }
      return memoria.get(k) ?? null;
    },
    setItem(k, v) {
      if (real && persistente) {
        try {
          real.setItem(k, v);
          return;
        } catch {
          persistente = false;
        }
      }
      memoria.set(k, v);
    },
    removeItem(k) {
      memoria.delete(k);
      if (real) {
        try {
          real.removeItem(k);
        } catch {
          persistente = false;
        }
      }
    },
  };
}

function leerJson<T>(almacen: Almacen, clave: string, esquema: z.ZodType<T>): T | null {
  try {
    const crudo = almacen.getItem(clave);
    if (!crudo) return null;
    const r = esquema.safeParse(JSON.parse(crudo));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

/** Pasaporte guardado, o null si no hay, está corrupto o tiene una `v` desconocida. */
export const leer = (almacen: Almacen): Pasaporte | null => leerJson(almacen, CLAVE_PASAPORTE, PasaporteSchema);

export function guardar(almacen: Almacen, p: Pasaporte): void {
  almacen.setItem(CLAVE_PASAPORTE, JSON.stringify(p));
}

export const leerPendiente = (almacen: Almacen): Pendiente | null => leerJson(almacen, CLAVE_PENDIENTE, PendienteSchema);

export function guardarPendiente(almacen: Almacen, p: Pendiente): void {
  almacen.setItem(CLAVE_PENDIENTE, JSON.stringify(p));
}

export const borrarPendiente = (almacen: Almacen): void => almacen.removeItem(CLAVE_PENDIENTE);

export function nuevoPasaporte(nombre: string, numero: string): Pasaporte {
  return { v: 1, nombre, numero, sellos: {} };
}

export type ResultadoSello = "nuevo" | "repetido";

/**
 * Idempotente: si el sello ya existe no cambia su fecha y devuelve "repetido".
 * No muta el pasaporte recibido.
 */
export function aplicarSello(
  p: Pasaporte,
  standId: string,
  ahora: Date = new Date(),
): { pasaporte: Pasaporte; resultado: ResultadoSello } {
  if (Object.hasOwn(p.sellos, standId)) return { pasaporte: p, resultado: "repetido" };
  return { pasaporte: { ...p, sellos: { ...p.sellos, [standId]: ahora.toISOString() } }, resultado: "nuevo" };
}

export function marcarCanjeado(p: Pasaporte, ahora: Date = new Date()): Pasaporte {
  return p.canjeadoEl ? p : { ...p, canjeadoEl: ahora.toISOString() };
}

export type EstadoPasaporte = "sin-pasaporte" | "vacio" | "progreso" | "casi" | "completo" | "canjeado";

/** Cuenta solo los sellos cuyo id está en `ids` (los stands vigentes). */
export function contarSellos(p: Pasaporte, ids: readonly string[]): number {
  return ids.filter((id) => Object.hasOwn(p.sellos, id)).length;
}

export function estadoPasaporte(p: Pasaporte | null, ids: readonly string[]): EstadoPasaporte {
  if (!p) return "sin-pasaporte";
  const n = contarSellos(p, ids);
  if (n >= ids.length && p.canjeadoEl) return "canjeado";
  if (n >= ids.length) return "completo";
  if (n === 0) return "vacio";
  return n === ids.length - 1 ? "casi" : "progreso";
}

/** "P-XXXXX": 5 caracteres de SHA-256("pasaporte:" + código normalizado). No usa caracteres del código. */
export async function derivarNumero(codigoNormalizado: string): Promise<string> {
  const h = await sha256(`pasaporte:${codigoNormalizado}`);
  let cuerpo = "";
  for (let i = 0; i < 5; i++) cuerpo += ALFABETO_CODIGO[h[i] % ALFABETO_CODIGO.length];
  return `P-${cuerpo}`;
}

/** Hash SHA-256 (hex) de la clave `k` de un QR, para comparar con src/data/sellos.json. */
export const hashClave = (k: string): Promise<string> => sha256Hex(k);

/** true si SHA-256(k) coincide con el hash guardado para ese stand. */
export async function claveValida(k: string | null | undefined, hashEsperado: string | undefined): Promise<boolean> {
  if (!k || !hashEsperado) return false;
  return (await hashClave(k)) === hashEsperado;
}
