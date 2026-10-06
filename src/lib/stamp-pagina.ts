// Comportamiento de /stamp/<standId>?k=<clave> (PROMPT-PASAPORTE.md, 3.6):
// valida la clave contra el hash de sellos.json, aplica el sello (idempotente)
// y muestra la respuesta que toca. Una clave falsa o ausente no guarda nada.
import { gates } from "../data/schedule";
import { formatoHoraLima } from "./fechas";
import { registrarSinConexion } from "./sw-registro";
import { abrirConCodigo, almacenDelNavegador, IDS_STANDS } from "./pasaporte-cliente";
import {
  aplicarSello, claveValida, contarSellos, guardar, guardarPendiente, leer, type AlmacenSeguro, type Pasaporte, type ResultadoSello,
} from "./pasaporte";

type Vista = "cargando" | "nuevo" | "repetido" | "espera" | "invalido";

const NOMBRE_STAND = new Map(gates.map((g) => [g.standId, g.name]));
const nombres = (ids: string[]): string => {
  const n = ids.map((id) => NOMBRE_STAND.get(id) ?? id);
  return n.length <= 1 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}`;
};
const $ = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

/** Pausa antes de pasar al pasaporte completo, para que se vea el último sello. */
const ESPERA_CUARTO_SELLO_MS = 1800;

export function armarStamp(): void {
  const raiz = $("stamp-raiz");
  if (!raiz) return;
  registrarSinConexion();
  const standId = raiz.dataset.stand ?? "";
  const hash = raiz.dataset.hash;
  const almacen: AlmacenSeguro = almacenDelNavegador();

  const mostrar = (cual: Vista) => {
    raiz.dataset.vista = cual;
    for (const v of ["cargando", "nuevo", "repetido", "espera", "invalido"] as const) {
      const el = $(`stamp-${v}`);
      if (el) el.hidden = v !== cual;
    }
    const barra = $("stamp-barra");
    if (barra) barra.hidden = cual !== "nuevo" && cual !== "repetido";
    window.scrollTo({ top: 0 });
  };

  function mostrarResultado(p: Pasaporte, resultado: ResultadoSello): void {
    const n = contarSellos(p, IDS_STANDS);
    const faltan = IDS_STANDS.filter((id) => !Object.hasOwn(p.sellos, id));
    const resumen = `${n} / ${IDS_STANDS.length} SELLOS`;
    const falta = faltan.length === 0 ? "Pasaporte completo." : faltan.length === 1 ? `Te falta ${nombres(faltan)}.` : `Te faltan ${nombres(faltan)}.`;
    const iso = p.sellos[standId];
    if (resultado === "nuevo") {
      $("stamp-hora")!.textContent = iso ? formatoHoraLima(iso) : "";
      $("stamp-progreso")!.textContent = resumen;
      $("stamp-faltan")!.textContent = falta;
      mostrar("nuevo");
      if (faltan.length === 0) {
        const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(() => location.assign("/pasaporte"), reducido ? 700 : ESPERA_CUARTO_SELLO_MS);
      }
    } else {
      $("stamp-hora-previa")!.textContent = iso ? formatoHoraLima(iso) : "";
      $("stamp-progreso-rep")!.textContent = resumen;
      $("stamp-faltan-rep")!.textContent = falta;
      mostrar("repetido");
    }
  }

  async function iniciar(): Promise<void> {
    const k = new URLSearchParams(location.search).get("k");
    if (!IDS_STANDS.includes(standId) || !(await claveValida(k, hash))) return mostrar("invalido");

    const p = leer(almacen);
    if (!p) {
      guardarPendiente(almacen, { id: standId, ts: new Date().toISOString() });
      return mostrar("espera");
    }
    const r = aplicarSello(p, standId);
    if (r.resultado === "nuevo") guardar(almacen, r.pasaporte);
    mostrarResultado(r.pasaporte, r.resultado);
  }

  $("stamp-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const error = $("stamp-error")!;
    const input = $<HTMLInputElement>("stamp-input")!;
    error.hidden = true;
    const r = await abrirConCodigo(input.value, almacen);
    if (!r.ok) {
      if (r.motivo === "codigo") {
        error.hidden = false;
        input.focus();
        input.select();
      }
      return;
    }
    input.value = "";
    mostrarResultado(r.pasaporte, r.pendienteAplicado === standId ? "nuevo" : "repetido");
  });
  $("stamp-input")?.addEventListener("input", () => ($("stamp-error")!.hidden = true));

  void iniciar();
}
