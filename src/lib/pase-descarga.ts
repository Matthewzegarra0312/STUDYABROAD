// "Descargar pase": el pase en PNG a 3x, con fondo, fuentes e imágenes embebidas.
// Se probaron html-to-image y html2canvas sobre este mismo pase: html2canvas
// reimplementa el CSS y desalinea el avión de "LIMA ✈ EL MUNDO", simula una
// negrita encima de Lilita One (ignora font-synthesis) y pierde las sombras.
// html-to-image (SVG foreignObject) lo pinta igual que el navegador.
import { toBlob } from "html-to-image";

const ESCALA = 3;

const esIOS = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const esWebKit = (): boolean => /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg/.test(navigator.userAgent);

/** "María José Pérez" a "maria-jose-perez". */
export const slugNombre = (nombre: string): string =>
  nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "pasajero";

/**
 * El pase en pantalla va sobre el cielo de la página; la imagen lleva su propio
 * cielo (.saf-captura, en pase.astro). Se captura una copia fuera de pantalla
 * para que la página no parpadee. En WebKit la copia omite sombras y muescas
 * (.saf-captura-simple): sus filtros y máscaras dentro de foreignObject pueden
 * dejar la imagen en blanco.
 */
export async function pasePng(nodo: HTMLElement): Promise<Blob> {
  const copia = document.createElement("div");
  copia.className = esWebKit() ? "saf-captura saf-captura-simple" : "saf-captura";
  copia.style.cssText = "position:fixed;left:-10000px;top:0;pointer-events:none;";
  copia.append(nodo.cloneNode(true));
  document.body.append(copia);
  try {
    await document.fonts.ready;
    await Promise.all(
      Array.from(copia.querySelectorAll("img"), (img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))),
    );
    // La copia vive fuera de pantalla: su posición no debe pasar a la imagen.
    const opciones = { pixelRatio: ESCALA, backgroundColor: "#3B99D8", cacheBust: false, style: { position: "static", left: "0", top: "0" } };
    // WebKit a veces pinta la primera pasada sin imágenes ni fuentes: se descarta.
    if (esWebKit()) await toBlob(copia, opciones).catch(() => undefined);
    const blob = await toBlob(copia, opciones);
    if (!blob) throw new Error("No se pudo generar la imagen del pase.");
    return blob;
  } finally {
    copia.remove();
  }
}

/** Imagen en pantalla para mantener presionada y guardar (respaldo de iOS). */
function mostrarParaGuardar(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const capa = document.createElement("div");
  capa.setAttribute("role", "dialog");
  capa.setAttribute("aria-label", "Tu pase como imagen");
  capa.style.cssText =
    "position:fixed;inset:0;z-index:100;background:rgba(5,8,20,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;color:#FDFEFC;font:700 15px Figtree,sans-serif;text-align:center";
  const img = document.createElement("img");
  img.src = url;
  img.alt = "Tu pase de abordaje";
  img.style.cssText = "max-width:100%;max-height:78vh;border-radius:14px";
  const nota = document.createElement("p");
  nota.textContent = "Mantén presionada la imagen y elige Guardar en Fotos.";
  nota.style.margin = "0";
  const cerrar = document.createElement("button");
  cerrar.type = "button";
  cerrar.textContent = "Cerrar";
  cerrar.style.cssText = "border:3px solid #FDFEFC;border-radius:99px;background:transparent;color:#FDFEFC;padding:10px 22px;font:800 15px Figtree,sans-serif";
  cerrar.addEventListener("click", () => {
    capa.remove();
    URL.revokeObjectURL(url);
  });
  capa.append(img, nota, cerrar);
  document.body.append(capa);
  cerrar.focus();
}

export async function descargarPase(nodo: HTMLElement, nombre: string): Promise<void> {
  const blob = await pasePng(nodo);
  const archivo = `pase-study-abroad-fest-${slugNombre(nombre)}.png`;

  if (esIOS()) {
    const file = new File([blob], archivo, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Mi pase · Study Abroad Fest" });
        return;
      } catch (e) {
        if ((e as DOMException).name === "AbortError") return;
      }
    }
    mostrarParaGuardar(blob);
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = archivo;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
