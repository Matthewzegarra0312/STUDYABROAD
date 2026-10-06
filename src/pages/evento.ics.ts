import type { APIRoute } from "astro";
import evento from "../data/evento";
import { fechaHoraLima } from "../lib/fechas";

// El .ics del propio evento es público (PLAN.md, sección 1: "El .ics del
// evento sí es público", a diferencia de los cierres de convocatorias,
// que son contenido protegido). Página estática: no necesita
// `prerender = false`.

function aFechaICS(fecha: Date): string {
  return fecha.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escaparTexto(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export const GET: APIRoute = () => {
  const inicio = fechaHoraLima(evento.fecha, evento.horaInicio);
  const fin = fechaHoraLima(evento.fecha, evento.horaFin);
  const ahora = new Date();

  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Study Abroad Fest 2026//Evento//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:evento-study-abroad-fest-2026@saf2026",
    `DTSTAMP:${aFechaICS(ahora)}`,
    `DTSTART:${aFechaICS(inicio)}`,
    `DTEND:${aFechaICS(fin)}`,
    `SUMMARY:${escaparTexto(evento.nombre)}`,
    // Solo el lugar: con la dirección escrita, Maps marca un punto a una cuadra.
    `LOCATION:${escaparTexto(evento.lugar)}`,
    `DESCRIPTION:${escaparTexto(
      `Organiza ${evento.organizadores.join(" y ")}. Inscripción previa: ${evento.lumaUrl}`,
    )}`,
    `URL:${evento.lumaUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lineas.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="study-abroad-fest-2026.ics"',
    },
  });
};
