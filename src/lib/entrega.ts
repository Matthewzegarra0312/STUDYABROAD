// Envío del registro de entrega al servidor (POST /api/mesa/entrega) cuando la mesa
// marca "Código entregado". Manda número, nombre, horas de los sellos y hora de la
// entrega, más el PIN para que el servidor lo verifique. Nunca el código del pase.
import type { Pasaporte } from "./pasaporte";

/** Marca en este celular de que la entrega todavía no llegó al servidor. */
export const CLAVE_ENTREGA_PENDIENTE = "study_abroad_delivery_pending";

export type ResultadoEnvio = "ok" | "pin" | "intentos" | "red";

export async function enviarEntrega(
  p: Pasaporte,
  pin: string,
  pedir: (url: string, init: RequestInit) => Promise<Response> = (url, init) => fetch(url, init),
): Promise<ResultadoEnvio> {
  if (!p.canjeadoEl) return "red";
  try {
    const r = await pedir("/api/mesa/entrega", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      body: JSON.stringify({ pin, numero: p.numero, nombre: p.nombre, sellos: p.sellos, canjeadoEl: p.canjeadoEl }),
    });
    if (r.ok) return "ok";
    if (r.status === 401) return "pin";
    if (r.status === 429) return "intentos";
    return "red";
  } catch {
    return "red";
  }
}
