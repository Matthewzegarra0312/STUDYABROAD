// Badges compartidos en LinkedIn (PROMPT-BADGE.md, tareas 6 y 7). El servidor
// solo guarda dos imágenes por badge en Vercel Blob (badges/<id>/badge.png y
// badges/<id>/preview.jpg). Nunca guarda nombre, mood ni nada personal.
import { BlobNotFoundError, head, put } from "@vercel/blob";
import { medidasJpeg, medidasPng } from "./imagen";

export const BADGE = { width: 1080, height: 1350, maxBytes: 4 * 1024 * 1024, tipo: "image/png" } as const;
export const PREVIEW = { width: 1200, height: 627, maxBytes: 1.5 * 1024 * 1024, tipo: "image/jpeg" } as const;

/** Tope del cuerpo completo de la petición (las dos imágenes más el multipart). */
export const MAX_CUERPO_BYTES = BADGE.maxBytes + PREVIEW.maxBytes + 64 * 1024;

export const SUBIDAS_POR_HORA = 10;

// Base32 (a-z y 2-7): 256 % 32 = 0, así que no hay sesgo al tomar el módulo.
const ALFABETO_ID = "abcdefghijklmnopqrstuvwxyz234567";
export const ID_BADGE_LARGO = 12;
export const ID_BADGE_RE = new RegExp(`^[a-z2-7]{${ID_BADGE_LARGO}}$`);

/** Id aleatorio de 12 caracteres (60 bits), no secuencial ni adivinable. */
export function generarIdBadge(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_BADGE_LARGO));
  return Array.from(bytes, (b) => ALFABETO_ID[b % 32]).join("");
}

export type ErrorSubida = "formato" | "tipo" | "medidas" | "tamano";

export interface SubidaValida {
  badge: Uint8Array;
  preview: Uint8Array;
}

type Resultado = { ok: true; valor: SubidaValida } | { ok: false; error: ErrorSubida };

/**
 * Valida los dos archivos del multipart: que existan, el tipo declarado y los
 * bytes reales (firma PNG/JPG), el tamaño máximo y las medidas exactas.
 */
export async function validarSubida(form: FormData): Promise<Resultado> {
  const badge = form.get("badge");
  const preview = form.get("preview");
  if (!(badge instanceof Blob) || !(preview instanceof Blob)) return { ok: false, error: "formato" };

  if (badge.type !== BADGE.tipo || preview.type !== PREVIEW.tipo) return { ok: false, error: "tipo" };
  if (badge.size > BADGE.maxBytes || preview.size > PREVIEW.maxBytes) return { ok: false, error: "tamano" };

  const bytesBadge = new Uint8Array(await badge.arrayBuffer());
  const bytesPreview = new Uint8Array(await preview.arrayBuffer());
  const medidasBadge = medidasPng(bytesBadge);
  const medidasPreview = medidasJpeg(bytesPreview);
  if (!medidasBadge || !medidasPreview) return { ok: false, error: "tipo" };
  if (medidasBadge.width !== BADGE.width || medidasBadge.height !== BADGE.height) return { ok: false, error: "medidas" };
  if (medidasPreview.width !== PREVIEW.width || medidasPreview.height !== PREVIEW.height) return { ok: false, error: "medidas" };

  return { ok: true, valor: { badge: bytesBadge, preview: bytesPreview } };
}

export const blobDisponible = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Sube las dos imágenes. Nunca sobrescribe: si el id ya existe, falla. */
export async function guardarBadge(id: string, { badge, preview }: SubidaValida): Promise<void> {
  const base = { access: "public", addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 60 * 60 * 24 * 30 } as const;
  await put(`badges/${id}/badge.png`, Buffer.from(badge), { ...base, contentType: BADGE.tipo });
  await put(`badges/${id}/preview.jpg`, Buffer.from(preview), { ...base, contentType: PREVIEW.tipo });
}

export interface BadgeGuardado {
  badgeUrl: string;
  previewUrl: string;
}

/** URLs públicas del badge, o null si no existe (o el id no tiene el formato). */
export async function obtenerBadge(id: string): Promise<BadgeGuardado | null> {
  if (!ID_BADGE_RE.test(id)) return null;
  try {
    const [badge, preview] = await Promise.all([head(`badges/${id}/badge.png`), head(`badges/${id}/preview.jpg`)]);
    return { badgeUrl: badge.url, previewUrl: preview.url };
  } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
}
