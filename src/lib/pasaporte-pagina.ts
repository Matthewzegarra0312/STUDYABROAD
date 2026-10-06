// Comportamiento de /pasaporte en el navegador: decide qué vista se muestra
// según lo guardado (src/lib/pasaporte.ts) y pinta el pasaporte sobre el HTML
// prerenderizado. Las vistas y los ganchos `data-libro-*` viven en
// src/pages/pasaporte.astro y src/components/pasaporte/LibroPasaporte.astro.
import { gates } from "../data/schedule";
import { sellosHash } from "../data/sellos";
import { crearEscaner, type ErrorCamara } from "./escaner";
import { interpretarQr } from "./qr-sello";
import { formatoHoraLima, formatoHoraLimaSegundos } from "./fechas";
import { lineasMrz } from "./mrz";
import {
  AVISO_SIN_ALMACEN, abrirConCodigo, almacenDelNavegador, IDS_STANDS, tomarCodigoDelFragmento,
} from "./pasaporte-cliente";
import { contarSellos, estadoPasaporte, leer, type AlmacenSeguro, type EstadoPasaporte, type Pasaporte } from "./pasaporte";

type Vista = "cargando" | "codigo" | "bienvenida" | "libro";

const NOMBRE_STAND = new Map(gates.map((g) => [g.standId, g.name]));
const nombres = (ids: string[]): string => {
  const n = ids.map((id) => NOMBRE_STAND.get(id) ?? id);
  return n.length <= 1 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}`;
};

const $ = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

function textos(p: Pasaporte, est: EstadoPasaporte): { titulo: string; sub: string; nota: string; etiqueta: string } {
  const n = contarSellos(p, IDS_STANDS);
  const faltan = IDS_STANDS.filter((id) => !Object.hasOwn(p.sellos, id));
  switch (est) {
    case "completo":
      return { etiqueta: "PASAPORTE SAF 2026", titulo: "Pasaporte completado", sub: "Has visitado todos los stands. ¡Buen viaje!", nota: "Muestra esta pantalla en la mesa de canje." };
    case "canjeado":
      return { etiqueta: "PASAPORTE SAF 2026", titulo: "Tu código ya está contigo", sub: "Ingresa tu código en la web y desbloquea el Calendario de becas.", nota: "" };
    case "casi":
      return { etiqueta: "PASAPORTE SAF 2026", titulo: "Te falta una puerta", sub: `Falta ${nombres(faltan)}. Casi lo logras.`, nota: `Falta ${nombres(faltan)}. Casi lo logras.` };
    case "progreso":
      return {
        etiqueta: "PASAPORTE SAF 2026",
        titulo: n === 1 ? "Ya tienes 1 sello" : `Ya tienes ${n} sellos`,
        sub: `Te faltan ${nombres(faltan)}. Pasa por esas puertas y escanea su QR.`,
        nota: "Visita otra puerta y escanea su QR.",
      };
    default:
      return { etiqueta: "PASAPORTE SAF 2026", titulo: "Tu recorrido comienza aquí", sub: "Empieza por cualquier puerta y escanea su QR.", nota: "Visita una puerta y escanea su QR." };
  }
}

/** Pinta los ganchos del libro con lo guardado. */
function pintarLibro(p: Pasaporte): void {
  const libro = document.querySelector<HTMLElement>("[data-libro]");
  if (!libro) return;
  const n = contarSellos(p, IDS_STANDS);
  libro.querySelector("[data-libro-titular]")!.textContent = p.nombre;
  libro.querySelector("[data-libro-numero]")!.textContent = p.numero;
  const [l1, l2] = lineasMrz(p.nombre, p.numero, n, IDS_STANDS.length);
  libro.querySelector("[data-libro-mrz1]")!.textContent = l1;
  libro.querySelector("[data-libro-mrz2]")!.textContent = l2;
  libro.querySelectorAll<HTMLElement>("[data-libro-slot]").forEach((slot) => {
    const iso = p.sellos[slot.dataset.libroSlot ?? ""];
    slot.toggleAttribute("data-sellado", !!iso);
    slot.querySelectorAll<HTMLElement>("[data-libro-sellado]").forEach((el) => (el.hidden = !iso));
    slot.querySelectorAll<HTMLElement>("[data-libro-pendiente]").forEach((el) => (el.hidden = !!iso));
    const hora = slot.querySelector("[data-libro-hora]");
    if (hora) hora.textContent = iso ? formatoHoraLima(iso) : "";
  });
  const sello = libro.querySelector<HTMLElement>("[data-libro-canjeado]");
  if (sello) {
    sello.hidden = !p.canjeadoEl;
    const h = libro.querySelector("[data-libro-canjeado-hora]");
    if (h && p.canjeadoEl) h.textContent = `10.10.26 · ${formatoHoraLima(p.canjeadoEl)}`.toUpperCase();
  }
}

export function armarPasaporte(): void {
  const raiz = $("pas-raiz");
  if (!raiz) return;
  const almacen: AlmacenSeguro = almacenDelNavegador();
  const quiereEscanear = location.hash === "#escanear";
  let pasaporte: Pasaporte | null = leer(almacen);
  let reloj: number | undefined;

  const vistas: Record<Vista, HTMLElement | null> = {
    cargando: $("pas-cargando"),
    codigo: $("pas-codigo"),
    bienvenida: $("pas-bienvenida"),
    libro: $("pas-libro"),
  };
  const mostrar = (cual: Vista) => {
    for (const [k, el] of Object.entries(vistas)) if (el) el.hidden = k !== cual;
    window.scrollTo({ top: 0 });
  };
  const aviso = (mensaje: string) => {
    const el = $("pas-aviso");
    if (!el) return;
    el.textContent = mensaje;
    el.hidden = !mensaje;
  };
  const revisarAlmacen = () => {
    const el = $("pas-aviso-almacen");
    if (!el) return;
    el.textContent = almacen.persistente ? "" : AVISO_SIN_ALMACEN;
    el.hidden = almacen.persistente;
  };

  function detenerReloj() {
    if (reloj !== undefined) window.clearInterval(reloj);
    reloj = undefined;
  }

  function pintar(p: Pasaporte): void {
    const est = estadoPasaporte(p, IDS_STANDS);
    const n = contarSellos(p, IDS_STANDS);
    raiz!.dataset.estado = est;
    const t = textos(p, est);
    $("pas-etiqueta")!.textContent = t.etiqueta;
    $("pas-titulo")!.textContent = t.titulo;
    $("pas-subtitulo")!.textContent = t.sub;
    $("pas-barra-nota")!.textContent = t.nota;
    document.querySelectorAll<HTMLElement>("[data-ruta]").forEach((el) => (el.hidden = Number(el.dataset.ruta) !== n));
    pintarLibro(p);

    const completo = est === "completo";
    $("pas-escanear")!.hidden = !(est === "vacio" || est === "progreso" || est === "casi");
    $("pas-canjear")!.hidden = !completo;
    $("pas-ir-canje")!.hidden = est !== "canjeado";
    $("pas-vivo")!.hidden = !completo;
    $("pas-aprobado")!.hidden = !completo;
    $("pas-nota-canjeado")!.hidden = est !== "canjeado";
    if (completo) {
      const ultimo = Object.values(p.sellos).sort().at(-1);
      $("pas-aprobado-hora")!.textContent = ultimo ? `${n} / ${IDS_STANDS.length} · ${formatoHoraLima(ultimo).toUpperCase()}` : "";
    }

    detenerReloj();
    if (completo) {
      const tick = () => ($("pas-reloj")!.textContent = formatoHoraLimaSegundos(new Date()));
      tick();
      reloj = window.setInterval(tick, 1000);
    }
  }

  function irAlLibro(): void {
    if (!pasaporte) return mostrar("codigo");
    pintar(pasaporte);
    mostrar("libro");
  }

  // Si la pestaña estaba en segundo plano, vuelve con la hora y el estado al día.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    pasaporte = leer(almacen) ?? pasaporte;
    if (pasaporte && !vistas.libro?.hidden) pintar(pasaporte);
  });

  async function abrir(entrada: string): Promise<void> {
    const error = $("pas-error")!;
    error.hidden = true;
    mostrar("cargando");
    const r = await abrirConCodigo(entrada, almacen);
    revisarAlmacen();
    if (!r.ok) {
      mostrar("codigo");
      if (r.motivo === "codigo") {
        error.hidden = false;
        const input = $<HTMLInputElement>("pas-input")!;
        input.focus();
        input.select();
      }
      return;
    }
    $<HTMLInputElement>("pas-input")!.value = "";
    pasaporte = r.pasaporte;
    if (r.pendienteAplicado) aviso(`Sumamos tu sello de ${NOMBRE_STAND.get(r.pendienteAplicado) ?? "este destino"}.`);
    if (contarSellos(pasaporte, IDS_STANDS) === 0) {
      $("pas-b-titular")!.textContent = pasaporte.nombre;
      $("pas-b-numero")!.textContent = `Nº ${pasaporte.numero}`;
      mostrar("bienvenida");
    } else {
      irAlLibro();
    }
  }

  $("pas-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    void abrir($<HTMLInputElement>("pas-input")!.value);
  });
  $("pas-input")?.addEventListener("input", () => ($("pas-error")!.hidden = true));
  $("pas-abrir-libro")?.addEventListener("click", irAlLibro);

  // Enlace para pasarlo al celular desde una computadora.
  const url = `${location.host}/pasaporte`;
  const urlEl = $("pas-url-celular");
  if (urlEl) urlEl.textContent = url;
  $("pas-copiar")?.addEventListener("click", async (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    try {
      await navigator.clipboard.writeText(`${location.origin}/pasaporte`);
      b.textContent = "Copiado";
    } catch {
      b.textContent = "Cópialo a mano";
    }
    window.setTimeout(() => (b.textContent = "Copiar enlace"), 2000);
  });

  // Escáner: lee el QR de un stand y navega a su /stamp, que aplica el sello.
  let abrirEscanerAlInicio = (): void => {};
  const panel = $("pas-escaner");
  const video = $<HTMLVideoElement>("pas-esc-video");
  const MOTIVOS: Record<ErrorCamara, string> = {
    denegada: "No tenemos permiso para usar la cámara.",
    "sin-camara": "No encontramos una cámara en este dispositivo.",
    "no-disponible": "La cámara no está disponible en este navegador.",
  };
  if (panel && video) {
    let ultimoInvalido = "";
    let invalidoHasta = 0;
    const escaner = crearEscaner(video, async (texto) => {
      const r = await interpretarQr(texto, location.origin, sellosHash);
      if (r) {
        escaner.cerrar();
        location.assign(r.destino);
        return;
      }
      // El mismo QR ajeno no repite el aviso en cada cuadro.
      if (texto === ultimoInvalido && Date.now() < invalidoHasta) return;
      ultimoInvalido = texto;
      invalidoHasta = Date.now() + 3000;
      $("pas-esc-invalido")!.hidden = false;
      window.setTimeout(() => ($("pas-esc-invalido")!.hidden = true), 3000);
    });
    const cerrarEscaner = () => {
      escaner.cerrar();
      panel.hidden = true;
      document.body.style.overflow = "";
    };
    const abrirEscaner = async () => {
      if (!pasaporte) return;
      $("pas-esc-contador")!.textContent = `${contarSellos(pasaporte, IDS_STANDS)} / ${IDS_STANDS.length} SELLOS`;
      panel.querySelectorAll<HTMLElement>("[data-esc-chip]").forEach((chip) => {
        const hecho = Object.hasOwn(pasaporte!.sellos, chip.dataset.escChip ?? "");
        chip.style.background = hecho ? (chip.dataset.color ?? "#6258BB") : "";
        chip.style.borderStyle = hecho ? "solid" : "";
        chip.style.borderColor = hecho ? "#FDFEFC" : "";
      });
      $("pas-esc-invalido")!.hidden = true;
      $("pas-esc-sin-camara")!.hidden = true;
      $("pas-esc-visor")!.hidden = false;
      panel.hidden = false;
      document.body.style.overflow = "hidden";
      $("pas-esc-cerrar")!.focus();
      const error = await escaner.abrir();
      if (error) {
        $("pas-esc-motivo")!.textContent = MOTIVOS[error];
        $("pas-esc-sin-camara")!.hidden = false;
        $("pas-esc-visor")!.hidden = true;
      }
    };
    $("pas-escanear")?.addEventListener("click", () => void abrirEscaner());
    $("pas-esc-cerrar")?.addEventListener("click", cerrarEscaner);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) cerrarEscaner();
    });
    window.addEventListener("pagehide", () => escaner.cerrar());
    // Desde /stamp ("Escanear de nuevo"): abre el escáner directo.
    abrirEscanerAlInicio = () => {
      const est = estadoPasaporte(pasaporte, IDS_STANDS);
      if (quiereEscanear && (est === "vacio" || est === "progreso" || est === "casi")) void abrirEscaner();
    };
  }

  revisarAlmacen();
  const codigo = tomarCodigoDelFragmento();
  if (codigo) void abrir(codigo);
  else if (pasaporte) {
    irAlLibro();
    abrirEscanerAlInicio();
  } else mostrar("codigo");
}
