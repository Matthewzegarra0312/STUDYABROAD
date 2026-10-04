// Render del badge en <canvas>. Todo corre en el navegador: la foto original
// nunca sale del dispositivo. Las medidas están en píxeles de la plantilla de
// 1080x1350; el canvas siempre es de 1080x1350, así que una plantilla 2x se
// reescala sola al dibujarla.
import cieloUrl from "../../assets/marca/hero-cielo-desktop.jpg?url";
import logoUrl from "../../assets/marca/logo study.png?url";

export const BADGE_WIDTH = 1080;
export const BADGE_HEIGHT = 1350;
export const PREVIEW_WIDTH = 1200;
export const PREVIEW_HEIGHT = 627;
export const PLANTILLA_URL = "/badge/plantilla.jpg";

export const MOODS = ["FELIZ", "A FULL", "CON TODO", "CON GANAS", "MODO VIAJE"] as const;
export type Mood = (typeof MOODS)[number];

export const NAME_MAX_LENGTH = 40;
const PHOTO_MAX_SIDE = 1600;

const MAGENTA = "#AC0AAB";
const INK = "#1A1A1A";
const FONT_SERIF = '"Arvo", Rockwell, serif';

/** Cajas de la plantilla (1080x1350). Único lugar donde viven las medidas. */
export const SLOTS = {
  foto: { x: 164, y: 721, w: 300, h: 396, radio: 18 },
  /** Borde magenta que se vuelve a trazar encima de la foto. */
  borde: { x: 163, y: 719, w: 303, h: 399, radio: 18, grosor: 6, color: MAGENTA },
  /** Una línea de 22 a 20 px; si no cabe, dos líneas de 19 a 18 px. Nunca baja de 18 px. */
  nombre: { x1: 485, y1: 742, x2: 917, y2: 814, centroY: 793, centrosDosLineas: [785, 803], dosLineasMaximo: 19, margen: 10, tamano: 22, unaLineaMinimo: 20, minimo: 18, espaciado: 0.04 },
  ocupacion: { x1: 485, y1: 814, x2: 917, y2: 887, centroY: 865, tamano: 22, espaciado: 0.1, texto: "ESTUDIANTE" },
  mood: { x1: 701, y1: 960, x2: 917, y2: 1033, centroY: 1010, margen: 6, tamano: 22, minimo: 14, espaciado: 0.1 },
} as const;

/** Foto ya decodificada y reducida a 1600 px de lado largo. */
export interface BadgePhoto {
  source: CanvasImageSource;
  width: number;
  height: number;
}

export interface BadgeState {
  photo: BadgePhoto | null;
  /** 1 = encuadre cover exacto; sube hasta 2.5. */
  zoom: number;
  /** Desplazamiento del encuadre, de -1 a 1 (0 = centrado). */
  panX: number;
  panY: number;
  name: string;
  mood: Mood;
}

export class PhotoError extends Error {}

// ---------------------------------------------------------------- recursos

const imagenes = new Map<string, Promise<HTMLImageElement>>();

function cargarImagen(url: string): Promise<HTMLImageElement> {
  let p = imagenes.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        imagenes.delete(url);
        reject(new Error(`No se pudo cargar ${url}`));
      };
      img.src = url;
    });
    imagenes.set(url, p);
  }
  return p;
}

let fuentesListas: Promise<void> | null = null;

/** Espera a que las fuentes del badge estén cargadas antes de dibujar. */
export function esperarFuentes(): Promise<void> {
  fuentesListas ??= Promise.all([
    document.fonts.load(`${SLOTS.nombre.tamano}px "Arvo"`, "ÁÉÍÓÚÑ"),
    document.fonts.load('64px "Lilita One"', "10 OCT 2026"),
    document.fonts.load('600 20px "IBM Plex Mono"', "SAF"),
  ]).then(
    () => undefined,
    () => undefined,
  );
  return fuentesListas;
}

/** Plantilla lista para dibujar. Se carga solo en /badge. */
export function cargarPlantilla(): Promise<HTMLImageElement> {
  return cargarImagen(PLANTILLA_URL);
}

// -------------------------------------------------------------------- foto

/**
 * Lee la foto con createImageBitmap (respeta la orientación EXIF) y la reduce
 * a 1600 px de lado largo. Si el navegador no la decodifica (p. ej. HEIC) lanza
 * PhotoError con un mensaje listo para mostrar.
 */
export async function leerFoto(file: File): Promise<BadgePhoto> {
  const mensaje = "No pudimos leer esa foto. Prueba con una imagen JPG o PNG.";
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new PhotoError(mensaje);
  }
  if (!bitmap.width || !bitmap.height) {
    bitmap.close();
    throw new PhotoError(mensaje);
  }

  const lado = Math.max(bitmap.width, bitmap.height);
  if (lado <= PHOTO_MAX_SIDE) return { source: bitmap, width: bitmap.width, height: bitmap.height };

  const k = PHOTO_MAX_SIDE / lado;
  const width = Math.round(bitmap.width * k);
  const height = Math.round(bitmap.height * k);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new PhotoError(mensaje);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return { source: canvas, width, height };
}

/** Rectángulo de origen (en píxeles de la foto) para un encuadre cover con zoom y desplazamiento. */
export function encuadreCover(
  foto: { width: number; height: number },
  caja: { w: number; h: number },
  zoom: number,
  panX: number,
  panY: number,
) {
  const z = Math.min(Math.max(zoom, 1), 2.5);
  const escala = Math.max(caja.w / foto.width, caja.h / foto.height) * z;
  const sw = caja.w / escala;
  const sh = caja.h / escala;
  const sobraX = foto.width - sw;
  const sobraY = foto.height - sh;
  const px = Math.min(Math.max(panX, -1), 1);
  const py = Math.min(Math.max(panY, -1), 1);
  return { sx: sobraX / 2 + (px * sobraX) / 2, sy: sobraY / 2 + (py * sobraY) / 2, sw, sh };
}

// ------------------------------------------------------------------ textos

/** Mayúsculas, sin espacios repetidos, máximo 40 caracteres. */
export function normalizarNombre(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toLocaleUpperCase("es-PE").slice(0, NAME_MAX_LENGTH);
}

function fijarFuente(ctx: CanvasRenderingContext2D, px: number, espaciado: number) {
  ctx.font = `400 ${px}px ${FONT_SERIF}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${(px * espaciado).toFixed(2)}px`;
}

/** Parte `texto` en dos por el espacio más cercano al centro (o por la mitad si no hay espacios). */
export function partirNombre(texto: string): [string, string] {
  const medio = texto.length / 2;
  let mejor = -1;
  for (let i = 0; i < texto.length; i++) {
    if (texto[i] === " " && (mejor < 0 || Math.abs(i - medio) < Math.abs(mejor - medio))) mejor = i;
  }
  if (mejor < 0) return [texto.slice(0, Math.ceil(medio)), texto.slice(Math.ceil(medio))];
  return [texto.slice(0, mejor), texto.slice(mejor + 1)];
}

function anchoTexto(ctx: CanvasRenderingContext2D, texto: string, px: number, espaciado: number) {
  fijarFuente(ctx, px, espaciado);
  return ctx.measureText(texto).width;
}

/**
 * Nombre en la casilla: una línea (22 a 20 px); si no cabe, dos líneas
 * partidas por el espacio más cercano al centro (19 a 18 px). Nunca baja de
 * 18 px; solo si aun así una línea no cabe se recorta con puntos suspensivos.
 */
function dibujarNombre(ctx: CanvasRenderingContext2D, texto: string) {
  const n = SLOTS.nombre;
  const cx = (n.x1 + n.x2) / 2;
  const anchoMax = n.x2 - n.x1 - n.margen * 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let px = n.tamano; px >= n.unaLineaMinimo; px -= 0.5) {
    if (anchoTexto(ctx, texto, px, n.espaciado) <= anchoMax) {
      fijarFuente(ctx, px, n.espaciado);
      ctx.fillText(texto, cx, n.centroY);
      return;
    }
  }

  const lineas = partirNombre(texto);
  let px = n.dosLineasMaximo;
  while (px > n.minimo && lineas.some((l) => anchoTexto(ctx, l, px, n.espaciado) > anchoMax)) px -= 0.5;
  fijarFuente(ctx, px, n.espaciado);
  lineas.forEach((linea, i) => {
    let t = linea;
    if (ctx.measureText(t).width > anchoMax) {
      while (t.length > 1 && ctx.measureText(`${t}…`).width > anchoMax) t = t.slice(0, -1);
      t = `${t.trimEnd()}…`;
    }
    ctx.fillText(t, cx, n.centrosDosLineas[i] ?? n.centroY);
  });
}

/** Dibuja `texto` centrado, bajando el tamaño hasta que quepa; si aun así no cabe, recorta con puntos suspensivos. */
function textoAjustado(
  ctx: CanvasRenderingContext2D,
  texto: string,
  cx: number,
  cy: number,
  anchoMax: number,
  tamano: number,
  minimo: number,
  espaciado: number,
) {
  let px = tamano;
  fijarFuente(ctx, px, espaciado);
  while (px > minimo && ctx.measureText(texto).width > anchoMax) {
    px -= 0.5;
    fijarFuente(ctx, px, espaciado);
  }
  let t = texto;
  if (ctx.measureText(t).width > anchoMax) {
    while (t.length > 1 && ctx.measureText(`${t}…`).width > anchoMax) t = t.slice(0, -1);
    t = `${t.trimEnd()}…`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(t, cx, cy);
}

// ------------------------------------------------------------------ badge

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * Dibuja el badge completo en un canvas de 1080x1350. Orden: 1) plantilla,
 * 2) foto con encuadre cover recortada al marco, 3) borde magenta encima,
 * 4) nombre, ocupación y mood.
 */
export async function dibujarBadge(canvas: HTMLCanvasElement, estado: BadgeState): Promise<void> {
  const [plantilla] = await Promise.all([cargarPlantilla(), esperarFuentes()]);
  if (canvas.width !== BADGE_WIDTH) canvas.width = BADGE_WIDTH;
  if (canvas.height !== BADGE_HEIGHT) canvas.height = BADGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no permite dibujar el badge.");

  ctx.clearRect(0, 0, BADGE_WIDTH, BADGE_HEIGHT);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(plantilla, 0, 0, BADGE_WIDTH, BADGE_HEIGHT);

  // Foto
  const f = SLOTS.foto;
  ctx.save();
  rectRedondeado(ctx, f.x, f.y, f.w, f.h, f.radio);
  ctx.clip();
  if (estado.photo) {
    const { sx, sy, sw, sh } = encuadreCover(estado.photo, f, estado.zoom, estado.panX, estado.panY);
    ctx.drawImage(estado.photo.source, sx, sy, sw, sh, f.x, f.y, f.w, f.h);
  } else {
    ctx.fillStyle = "#CFE6F6";
    ctx.fillRect(f.x, f.y, f.w, f.h);
  }
  ctx.restore();

  const b = SLOTS.borde;
  rectRedondeado(ctx, b.x, b.y, b.w, b.h, b.radio);
  ctx.lineWidth = b.grosor;
  ctx.strokeStyle = b.color;
  ctx.stroke();

  // Textos
  ctx.fillStyle = INK;
  dibujarNombre(ctx, normalizarNombre(estado.name) || "TU NOMBRE");

  const o = SLOTS.ocupacion;
  textoAjustado(ctx, o.texto, (o.x1 + o.x2) / 2, o.centroY, o.x2 - o.x1, o.tamano, o.tamano, o.espaciado);

  const m = SLOTS.mood;
  textoAjustado(ctx, estado.mood, (m.x1 + m.x2) / 2, m.centroY, m.x2 - m.x1 - m.margen * 2, m.tamano, m.minimo, m.espaciado);

  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}

function aBlob(canvas: HTMLCanvasElement, tipo: string, calidad?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen."))), tipo, calidad);
  });
}

/** Badge final como PNG de 1080x1350. */
export async function badgeABlob(estado: BadgeState): Promise<Blob> {
  const canvas = document.createElement("canvas");
  await dibujarBadge(canvas, estado);
  return aBlob(canvas, "image/png");
}

// ------------------------------------------------------- vista previa 1200x627

/**
 * Imagen horizontal para la tarjeta de LinkedIn: cielo del diseño Viaje, badge
 * completo (sin recortar) al centro, logo SAF a la izquierda y la fecha a la derecha.
 */
export async function previewABlob(estado: BadgeState): Promise<Blob> {
  const [cielo, logo] = await Promise.all([cargarImagen(cieloUrl), cargarImagen(logoUrl)]);
  const badgeCanvas = document.createElement("canvas");
  await dibujarBadge(badgeCanvas, estado);

  const canvas = document.createElement("canvas");
  canvas.width = PREVIEW_WIDTH;
  canvas.height = PREVIEW_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no permite dibujar la imagen.");
  ctx.imageSmoothingQuality = "high";

  // Cielo (cover) con velo azul para que el texto blanco se lea.
  const k = Math.max(PREVIEW_WIDTH / cielo.naturalWidth, PREVIEW_HEIGHT / cielo.naturalHeight);
  const cw = cielo.naturalWidth * k;
  const ch = cielo.naturalHeight * k;
  ctx.drawImage(cielo, (PREVIEW_WIDTH - cw) / 2, (PREVIEW_HEIGHT - ch) / 2, cw, ch);
  ctx.fillStyle = "rgb(47 134 196 / 0.35)";
  ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

  // Badge centrado, completo, con borde de papel y sombra.
  const borde = 8;
  const margen = 26;
  const bh = PREVIEW_HEIGHT - margen * 2 - borde * 2;
  const bw = (bh * BADGE_WIDTH) / BADGE_HEIGHT;
  const bx = (PREVIEW_WIDTH - bw) / 2;
  const by = margen + borde;
  ctx.save();
  ctx.shadowColor = "rgb(29 33 82 / 0.45)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = "#FDFEFC";
  rectRedondeado(ctx, bx - borde, by - borde, bw + borde * 2, bh + borde * 2, 22);
  ctx.fill();
  ctx.restore();
  ctx.save();
  rectRedondeado(ctx, bx, by, bw, bh, 16);
  ctx.clip();
  ctx.drawImage(badgeCanvas, bx, by, bw, bh);
  ctx.restore();

  // Logo SAF a la izquierda.
  const lh = 300;
  const lw = (lh * logo.naturalWidth) / logo.naturalHeight;
  const colIzq = (bx - borde) / 2;
  ctx.drawImage(logo, colIzq - lw / 2, (PREVIEW_HEIGHT - lh) / 2, lw, lh);

  // Fecha a la derecha.
  const colDer = (bx + bw + borde + PREVIEW_WIDTH) / 2;
  ctx.save();
  ctx.translate(colDer, PREVIEW_HEIGHT / 2);
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FDFEFC";
  ctx.shadowColor = "rgb(29 33 82 / 0.35)";
  ctx.shadowOffsetY = 4;
  ctx.font = '400 68px "Lilita One", sans-serif';
  ctx.fillText("10 OCT", 0, -24);
  ctx.fillText("2026", 0, 44);
  ctx.restore();

  return aBlob(canvas, "image/jpeg", 0.88);
}
