// Utilidades de fecha/hora en español de Perú, siempre en la zona horaria
// del evento (CLAUDE.md · Convenciones técnicas). Perú no observa horario
// de verano, así que el offset -05:00 es válido todo el año.

const LOCALE = "es-PE";
const ZONA_HORARIA = "America/Lima";
const OFFSET_LIMA = "-05:00";

/** Convierte "YYYY-MM-DD" + "HH:mm" (hora de Lima) a un Date real. */
export function fechaHoraLima(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00${OFFSET_LIMA}`);
}

/** "sáb, 10 oct 2026" a partir de una fecha "YYYY-MM-DD". */
export function formatoFechaCorta(fecha: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA_HORARIA,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(fechaHoraLima(fecha, "00:00"));
}

/** "2:00 p. m." a partir de una hora "HH:mm". */
export function formatoHora12(hora: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA_HORARIA,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(fechaHoraLima("2000-01-01", hora));
}

export interface CuentaRegresiva {
  dias: number;
  horas: number;
  minutos: number;
}

/**
 * Cuenta regresiva en días/horas/minutos completos hasta `fecha` + `hora`
 * (hora de Lima). Nunca baja de cero: pasado el momento, todo queda en 0.
 */
export function cuentaRegresiva(fecha: string, hora: string, ahora: Date = new Date()): CuentaRegresiva {
  const objetivo = fechaHoraLima(fecha, hora);
  const minutosTotales = Math.max(0, Math.floor((objetivo.getTime() - ahora.getTime()) / 60_000));
  return {
    dias: Math.floor(minutosTotales / 1440),
    horas: Math.floor((minutosTotales % 1440) / 60),
    minutos: minutosTotales % 60,
  };
}

/** "2:31 p. m." a partir de un instante ISO, en hora de Lima. */
export function formatoHoraLima(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
}

/** "4:51:07 p. m." en hora de Lima, para la franja de verificación en vivo. */
export function formatoHoraLimaSegundos(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(d);
}
