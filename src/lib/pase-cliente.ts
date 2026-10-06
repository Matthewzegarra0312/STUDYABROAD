// /pase: lee el código (ruta /pase/<codigo>, #c= o ?c=), lo valida en el
// navegador, limpia la barra de direcciones y muestra el mismo pase del correo.
// El HTML del pase es src/components/pase/pase.html, copiado tal cual de la
// plantilla de saf-pases (templates/correo.html, entre PASE:INICIO y PASE:FIN).
import QRCode from "qrcode";
import plantillaPase from "../components/pase/pase.html?raw";
import { abrirPase, normalizarCodigo, type ContenidoPase } from "./pase-cripto";
import { descargarPase } from "./pase-descarga";

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Mismas variables y mismo escape que el correo. */
export async function rellenarPase(c: ContenidoPase): Promise<string> {
  const qr = await QRCode.toDataURL(c.q, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 342,
    color: { dark: "#1D2152", light: "#FFFFFF" },
  });
  const vars: Record<string, string> = {
    nombre: c.n,
    nombre_px: String(c.px === 22 ? 22 : 27),
    pie_espacio: String(Math.max(0, Math.round(c.pie))),
    qr_src: qr,
  };
  return plantillaPase.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, k: string) => esc(vars[k] ?? ""));
}

/** Código de la URL: /pase/<codigo>, #c=<codigo> o ?c=<codigo>. */
export function codigoDeUrl(u: URL): string | null {
  const ruta = u.pathname.match(/^\/pase\/([^/]+)\/?$/)?.[1];
  const hash = new URLSearchParams(u.hash.replace(/^#/, "")).get("c");
  const query = u.searchParams.get("c");
  const crudo = ruta ? decodeURIComponent(ruta) : (hash ?? query);
  return crudo && crudo.trim() ? crudo : null;
}

export function armarPagina(): void {
  const raiz = document.getElementById("pase-raiz");
  const form = document.getElementById("pase-form") as HTMLFormElement | null;
  const input = document.getElementById("pase-codigo") as HTMLInputElement | null;
  const error = document.getElementById("pase-error");
  const estado = document.getElementById("pase-estado");
  const vista = document.getElementById("pase-vista");
  const contenedor = document.getElementById("pase-contenedor");
  const boton = document.getElementById("pase-descargar") as HTMLButtonElement | null;
  const otro = document.getElementById("pase-otro");
  if (!raiz || !form || !input || !error || !estado || !vista || !contenedor || !boton || !otro) return;

  const chip = document.getElementById("pase-chip");
  const chipPunto = document.getElementById("pase-chip-punto");
  const bajada = document.getElementById("pase-bajada");
  const abrirPasaporte = document.getElementById("pase-abrir-pasaporte");
  const BAJADA_FORM = bajada?.textContent ?? "";

  let nombreActual = "";
  // Solo en memoria: sirve para pasarle el código a /pasaporte. No se guarda.
  let codigoActual = "";

  const mostrar = (cual: "form" | "cargando" | "pase") => {
    form.hidden = cual === "pase";
    estado.hidden = cual !== "cargando";
    vista.hidden = cual !== "pase";
    if (chip) chip.textContent = cual === "pase" ? "CHECK-IN LISTO" : "CHECK-IN · SAF 2026";
    chipPunto?.classList.toggle("hidden", cual !== "pase");
    if (bajada) bajada.textContent = cual === "pase" ? "Muéstralo en el ingreso. Es el mismo QR de tu inscripción en Luma." : BAJADA_FORM;
    form.querySelectorAll("input,button").forEach((el) => ((el as HTMLInputElement).disabled = cual === "cargando"));
  };

  const fallar = () => {
    error.hidden = false;
    mostrar("form");
    input.focus();
    input.select();
  };

  async function validar(entrada: string): Promise<void> {
    error!.hidden = true;
    const codigo = normalizarCodigo(entrada);
    if (!codigo) return fallar();
    mostrar("cargando");
    const c = await abrirPase(codigo);
    if (!c) return fallar();
    contenedor!.innerHTML = await rellenarPase(c);
    nombreActual = c.n;
    codigoActual = codigo;
    input!.value = "";
    mostrar("pase");
    vista!.scrollIntoView({ block: "start" });
  }

  const inicial = codigoDeUrl(new URL(location.href));
  if (inicial) {
    input.value = inicial;
    // El código no se queda en la barra, en el historial ni al compartir la URL.
    history.replaceState(null, "", "/pase");
    void validar(inicial);
  } else {
    mostrar("form");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void validar(input.value);
  });
  input.addEventListener("input", () => {
    error.hidden = true;
  });
  abrirPasaporte?.addEventListener("click", () => {
    if (codigoActual) location.assign(`/pasaporte#c=${encodeURIComponent(codigoActual)}`);
  });
  otro.addEventListener("click", () => {
    codigoActual = "";
    contenedor.innerHTML = "";
    mostrar("form");
    input.focus();
  });
  boton.addEventListener("click", async () => {
    const pase = contenedor.querySelector<HTMLElement>(".saf-pase");
    if (!pase) return;
    const texto = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Preparando imagen…";
    try {
      await descargarPase(pase, nombreActual);
    } finally {
      boton.disabled = false;
      boton.textContent = texto;
    }
  });
}
