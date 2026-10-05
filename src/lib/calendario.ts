import evento from "../data/evento";
import { fechaHoraLima } from "./fechas";

function aFechaGoogle(fecha: Date): string {
  return fecha.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * URL de "Agregar a Google Calendar" para el evento, con los mismos datos
 * que el .ics público (src/pages/evento.ics.ts).
 */
export function googleCalendarUrl(): string {
  const inicio = fechaHoraLima(evento.fecha, evento.horaInicio);
  const fin = fechaHoraLima(evento.fecha, evento.horaFin);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", evento.nombre);
  url.searchParams.set("dates", `${aFechaGoogle(inicio)}/${aFechaGoogle(fin)}`);
  url.searchParams.set("ctz", "America/Lima");
  url.searchParams.set("location", `${evento.lugar}, ${evento.direccion}`);
  url.searchParams.set(
    "details",
    `Organiza ${evento.organizadores.join(" y ")}. Inscripción previa: ${evento.lumaUrl}`,
  );
  return url.toString();
}
