// Lógica de navegador compartida por /pasaporte y /stamp/[id]: abrir el
// pasaporte con el código del pase y aplicar sellos. El código de 10 caracteres
// se usa solo para descifrar el pase y derivar el número; no se guarda.
import { gates } from "../data/schedule";
import { abrirPase, normalizarCodigo } from "./pase-cripto";
import {
  aplicarSello, borrarPendiente, crearAlmacen, derivarNumero, guardar, leer, leerPendiente, nuevoPasaporte,
  type AlmacenSeguro, type Pasaporte,
} from "./pasaporte";

export const IDS_STANDS: readonly string[] = gates.map((g) => g.standId);

export const almacenDelNavegador = (): AlmacenSeguro => crearAlmacen(() => window.localStorage);

export const AVISO_SIN_ALMACEN = "Tu navegador no puede guardar tus sellos. Sal del modo incógnito.";

export type ResultadoApertura =
  | { ok: true; pasaporte: Pasaporte; /** standId del sello pendiente que se estampó al abrir. */ pendienteAplicado?: string }
  | { ok: false; motivo: "codigo" | "cancelado" };

/**
 * Abre (o crea) el pasaporte con el código del pase. Si el navegador ya tiene el
 * de otra persona, pide confirmación antes de reemplazarlo. Si había un sello
 * leído antes de abrir, lo estampa.
 */
export async function abrirConCodigo(
  entrada: string,
  almacen: AlmacenSeguro,
  confirmarReemplazo: () => boolean = () => window.confirm("Este celular ya tiene el pasaporte de otra persona. ¿Reemplazarlo?"),
): Promise<ResultadoApertura> {
  const codigo = normalizarCodigo(entrada);
  if (!codigo) return { ok: false, motivo: "codigo" };
  const contenido = await abrirPase(codigo);
  if (!contenido) return { ok: false, motivo: "codigo" };
  const numero = await derivarNumero(codigo);

  const actual = leer(almacen);
  let pasaporte: Pasaporte;
  if (actual && actual.numero === numero) {
    pasaporte = { ...actual, nombre: contenido.n };
  } else {
    if (actual && !confirmarReemplazo()) return { ok: false, motivo: "cancelado" };
    pasaporte = nuevoPasaporte(contenido.n, numero);
  }

  let pendienteAplicado: string | undefined;
  const pendiente = leerPendiente(almacen);
  if (pendiente && IDS_STANDS.includes(pendiente.id)) {
    const r = aplicarSello(pasaporte, pendiente.id, new Date(pendiente.ts));
    pasaporte = r.pasaporte;
    if (r.resultado === "nuevo") pendienteAplicado = pendiente.id;
  }
  borrarPendiente(almacen);
  guardar(almacen, pasaporte);
  return { ok: true, pasaporte, pendienteAplicado };
}

/** Código de `#c=<codigo>`. Lo borra de la barra de direcciones apenas lo lee. */
export function tomarCodigoDelFragmento(): string | null {
  const c = new URLSearchParams(location.hash.replace(/^#/, "")).get("c");
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  return c && c.trim() ? c : null;
}
