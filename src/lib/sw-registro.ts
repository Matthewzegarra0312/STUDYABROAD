// Registra public/sw.js (modo sin conexión) y le pasa las páginas del pasaporte.
// Solo lo llaman /pasaporte y /stamp/*. En desarrollo no se registra: Vite sirve
// módulos que no tiene sentido guardar.
import { gates } from "../data/schedule";

export const PAGINAS_PASAPORTE: readonly string[] = ["/pasaporte", ...gates.map((g) => `/stamp/${g.standId}`)];

export function registrarSinConexion(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const iniciar = async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
      const listo = await navigator.serviceWorker.ready;
      listo.active?.postMessage({ tipo: "precachear", urls: PAGINAS_PASAPORTE });
    } catch {
      // Sin service worker el pasaporte funciona igual, solo que necesita conexión.
    }
  };
  if (document.readyState === "complete") void iniciar();
  else window.addEventListener("load", () => void iniciar(), { once: true });
}
