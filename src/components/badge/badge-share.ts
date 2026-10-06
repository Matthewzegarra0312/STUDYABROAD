// Compartir el badge. "Compartir en LinkedIn" no sube nada a ningún servidor: el
// post lleva solo el enlace de inscripción. LinkedIn no deja adjuntar imágenes
// por URL, así que el badge viaja aparte: en celulares por el menú de compartir
// del sistema, y en escritorio se descarga y se copia al portapapeles (se pega
// con Ctrl+V en el borrador). Nada de esto hace peticiones.
import { badgeABlob, type BadgeState } from "./badge-canvas";

export const MENSAJES = {
  respaldo: "No pudimos preparar tu borrador. Descarga tu imagen y copia el texto para publicarla tú.",
} as const;

/** Error con un mensaje listo para mostrar a la persona. */
export class ErrorCompartir extends Error {}

/** Reemplaza {enlace} en la plantilla del post. */
export function textoPost(plantilla: string, enlace: string): string {
  return plantilla.replaceAll("{enlace}", enlace);
}

export function enlaceLinkedIn(texto: string): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(texto)}`;
}

/** En celulares el borrador se abre en la misma pestaña para que el sistema ofrezca la app. */
export function esMovil(): boolean {
  return window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 1023px)").matches;
}

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** Guarda el PNG en el dispositivo. No hace ninguna petición. */
export async function descargarBadge(estado: BadgeState): Promise<void> {
  guardarBlob(await badgeABlob(estado));
}

function guardarBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mi-badge-study-abroad-fest-2026.png";
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export interface ResultadoCompartir {
  /** El texto quedó en el portapapeles (respaldo por si LinkedIn no lo escribe solo). */
  copiado: boolean;
  /**
   * Cómo viaja la imagen del badge: "compartida" (menú del sistema, ya no se
   * abre el borrador), "pegar" (copiada al portapapeles para pegarla en el
   * borrador) o "ninguna" (hay que descargarla).
   */
  imagen: "compartida" | "pegar" | "ninguna";
}

/**
 * Copia el PNG al portapapeles. El blob se entrega como promesa para escribirlo
 * dentro del gesto del clic, antes de esperar la subida.
 */
async function copiarImagen(blob: Promise<Blob>): Promise<boolean> {
  try {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Abre el menú de compartir con la imagen y el texto. false si no se pudo usar. */
async function compartirConImagen(blob: Blob, texto: string): Promise<"hecho" | "cancelado" | "no"> {
  const archivo = new File([blob], "mi-badge-study-abroad-fest-2026.png", { type: "image/png" });
  try {
    if (!navigator.share || !navigator.canShare?.({ files: [archivo] })) return "no";
    await navigator.share({ files: [archivo], text: texto });
    return "hecho";
  } catch (e) {
    return e instanceof DOMException && e.name === "AbortError" ? "cancelado" : "no";
  }
}

/** Pestaña de espera mientras se sube el badge, para que no quede en blanco. */
function abrirPestanaEspera(): Window | null {
  const ventana = window.open("", "_blank");
  if (!ventana) return null;
  try {
    ventana.document.title = "Preparando tu publicación...";
    ventana.document.body.style.cssText =
      "margin:0;min-height:100vh;display:grid;place-items:center;font:600 18px system-ui,sans-serif;color:#1D2152;background:#F1F3FA";
    ventana.document.body.textContent = "Preparando tu publicación de LinkedIn...";
  } catch {
    // Si el navegador no deja escribir en la pestaña, igual se redirige después.
  }
  return ventana;
}

/** Lleva la pestaña de espera al borrador; si ya no existe, usa la pestaña actual. */
function irA(ventana: Window | null, destino: string): void {
  if (ventana && !ventana.closed) {
    try {
      ventana.location.replace(destino);
      ventana.opener = null;
      return;
    } catch {
      ventana.close();
    }
  }
  window.location.assign(destino);
}

/**
 * Abre el borrador de LinkedIn con el texto y el enlace de inscripción. Debe
 * llamarse directamente desde el clic para que el navegador no bloquee la
 * pestaña. Lanza ErrorCompartir con el mensaje a mostrar.
 */
export async function compartirEnLinkedIn(estado: BadgeState, plantilla: string, enlace: string): Promise<ResultadoCompartir> {
  const movil = esMovil();
  const ventana = movil ? null : abrirPestanaEspera();
  const badge = badgeABlob(estado);
  // En escritorio se copia ya, dentro del clic. En celular el menú del sistema adjunta el archivo.
  const imagenCopiada = movil ? Promise.resolve(false) : copiarImagen(badge);

  const texto = textoPost(plantilla, enlace);
  if (movil) {
    const resultado = await compartirConImagen(await badge, texto);
    if (resultado !== "no") return { copiado: false, imagen: "compartida" };
  }

  // Con la pestaña nueva enfocada, el portapapeles de esta página puede quedarse
  // esperando a recuperar el foco y la redirección nunca llegaba (about:blank).
  // Se le da un tope corto y se redirige igual. Si la imagen ya está en el
  // portapapeles no se pisa con el texto: el texto va en la URL del borrador.
  const conTope = <T,>(p: Promise<T>, vacio: T) =>
    Promise.race([p, new Promise<T>((resolver) => window.setTimeout(() => resolver(vacio), 1500))]);
  const pegar = await conTope(imagenCopiada, false);
  // Como en el resto de los casos LinkedIn no adjunta la imagen sola, el badge
  // también se descarga: la persona lo sube al borrador si el pegado no funciona.
  guardarBlob(await badge);
  const copiado = pegar ? false : await conTope(copiarTexto(texto), false);
  irA(ventana, enlaceLinkedIn(texto));
  return { copiado, imagen: pegar ? "pegar" : "ninguna" };
}
