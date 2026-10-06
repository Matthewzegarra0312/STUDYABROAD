// Registro de entregas de la mesa de canje (solo servidor). Lógica pura, sin Astro
// ni Redis, para probarla con pruebas unitarias; el guardado vive en redis.ts y la
// ruta en src/pages/api/mesa/entrega.ts.
//
// Se guarda lo mínimo para saber quién completó el pasaporte y cuándo se le entregó
// el código: número de pasaporte, nombre, hora de cada sello y hora de la entrega.
// NUNCA el código de 10 caracteres del pase ni el PIN.
import { ALFABETO_CODIGO } from "./alfabetoCodigo";

export interface Entrega {
  /** "P-XXXXX", derivado del código del pase (src/lib/pasaporte.ts). */
  numero: string;
  nombre: string;
  /** standId -> ISO 8601 de cuando se selló. */
  sellos: Record<string, string>;
  /** Cuándo se marcó "Código entregado" en el celular. */
  canjeadoEl: string;
  /** Cuándo llegó al servidor. */
  registradoEl: string;
}

const NUMERO_RE = new RegExp(`^P-[${ALFABETO_CODIGO}]{5}$`);

function esIso(v: unknown): v is string {
  return typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
}

/**
 * Valida el cuerpo que manda el celular. Exige los 4 sellos: solo se registra un
 * pasaporte completo. Devuelve null si algo no cuadra (sin decir qué, para no dar pistas).
 */
export function validarEntrega(cuerpo: unknown, idsStands: readonly string[], ahora: Date = new Date()): Entrega | null {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const c = cuerpo as Record<string, unknown>;
  if (typeof c.numero !== "string" || !NUMERO_RE.test(c.numero)) return null;
  if (typeof c.nombre !== "string") return null;
  const nombre = c.nombre.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (nombre.length < 1 || nombre.length > 120) return null;
  if (!c.sellos || typeof c.sellos !== "object") return null;
  const sellos: Record<string, string> = {};
  for (const id of idsStands) {
    const iso = (c.sellos as Record<string, unknown>)[id];
    if (!esIso(iso)) return null;
    sellos[id] = new Date(iso).toISOString();
  }
  if (!esIso(c.canjeadoEl)) return null;
  return { numero: c.numero, nombre, sellos, canjeadoEl: new Date(c.canjeadoEl).toISOString(), registradoEl: ahora.toISOString() };
}

const celda = (v: string): string => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CSV listo para Excel (con BOM), ordenado por hora de entrega. */
export function entregasACsv(entregas: readonly Entrega[], idsStands: readonly string[]): string {
  const orden = [...entregas].sort((a, b) => a.canjeadoEl.localeCompare(b.canjeadoEl));
  const cabecera = ["N° de pasaporte", "Nombre", "Entregado el (ISO)", "Registrado el (ISO)", ...idsStands.map((id) => `Sello ${id}`)];
  const filas = orden.map((e) => [e.numero, e.nombre, e.canjeadoEl, e.registradoEl, ...idsStands.map((id) => e.sellos[id] ?? "")]);
  return `﻿${[cabecera, ...filas].map((f) => f.map(celda).join(",")).join("\r\n")}\r\n`;
}
