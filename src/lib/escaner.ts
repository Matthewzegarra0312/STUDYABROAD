// Cámara trasera + lectura de QR dentro del pasaporte (PROMPT-PASAPORTE.md, 3.5).
// Usa BarcodeDetector si existe; si no, jsQR (pura JS, se carga solo al abrir).
// La cámara se libera siempre: al cerrar, al leer, al ocultar la pestaña y al
// salir de la página.

interface DetectorQr {
  detect(fuente: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type ConstructorDetector = new (o: { formats: string[] }) => DetectorQr;

export type ErrorCamara = "denegada" | "sin-camara" | "no-disponible";

export interface Escaner {
  /** Pide la cámara y empieza a leer. Devuelve un error legible, o null si arrancó. */
  abrir(): Promise<ErrorCamara | null>;
  cerrar(): void;
}

const INTERVALO_MS = 150;

export function crearEscaner(video: HTMLVideoElement, alLeer: (texto: string) => void): Escaner {
  let flujo: MediaStream | null = null;
  let activo = false;
  let temporizador: number | undefined;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const Detector = (globalThis as { BarcodeDetector?: ConstructorDetector }).BarcodeDetector;
  const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;

  function cerrar(): void {
    activo = false;
    if (temporizador !== undefined) window.clearTimeout(temporizador);
    temporizador = undefined;
    flujo?.getTracks().forEach((t) => t.stop());
    flujo = null;
    video.srcObject = null;
    document.removeEventListener("visibilitychange", alOcultar);
    window.removeEventListener("pagehide", cerrar);
  }

  function alOcultar(): void {
    if (document.hidden) cerrar();
  }

  async function leerCuadro(): Promise<string | null> {
    if (video.readyState < 2 || !video.videoWidth) return null;
    if (detector) {
      try {
        return (await detector.detect(video))[0]?.rawValue ?? null;
      } catch {
        return null;
      }
    }
    if (!ctx) return null;
    // Reducir el cuadro basta para un QR de 10 cm y baja mucho el costo en gama baja.
    const escala = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * escala);
    canvas.height = Math.round(video.videoHeight * escala);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { default: jsQR } = await import("jsqr");
    const datos = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(datos.data, datos.width, datos.height, { inversionAttempts: "dontInvert" })?.data ?? null;
  }

  function ciclo(): void {
    if (!activo) return;
    void leerCuadro()
      .catch(() => null)
      .then((texto) => {
        if (!activo) return;
        if (texto) alLeer(texto);
        if (activo) temporizador = window.setTimeout(ciclo, INTERVALO_MS);
      });
  }

  async function abrir(): Promise<ErrorCamara | null> {
    if (!navigator.mediaDevices?.getUserMedia) return "no-disponible";
    try {
      flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    } catch (e) {
      const nombre = (e as DOMException).name;
      return nombre === "NotFoundError" || nombre === "OverconstrainedError" ? "sin-camara" : nombre === "NotAllowedError" || nombre === "SecurityError" ? "denegada" : "no-disponible";
    }
    video.srcObject = flujo;
    video.setAttribute("playsinline", "");
    video.muted = true;
    try {
      await video.play();
    } catch {
      cerrar();
      return "no-disponible";
    }
    activo = true;
    document.addEventListener("visibilitychange", alOcultar);
    window.addEventListener("pagehide", cerrar);
    ciclo();
    return null;
  }

  return { abrir, cerrar };
}
