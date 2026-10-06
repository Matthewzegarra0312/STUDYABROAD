import { EventoSchema, type Evento } from "./schema";

const evento: Evento = EventoSchema.parse({
  nombre: "Study Abroad Fest",
  fecha: "2026-10-10",
  horaInicio: "14:00",
  horaFin: "18:00",
  lugar: "Centro de convenciones UTP",
  direccion: "Av. Petit Thouars 116, Lima",
  mapaUrl: "https://maps.app.goo.gl/3AqFumREKmqrjo4q7",
  zonaHoraria: "America/Lima",
  gratuito: true,
  inscripcionPrevia: true,
  lumaUrl: "https://luma.com/txyuybq9?tk=pwCvrY",
  organizadores: ["LEAD UTP · Pilar de Excelencia Académica", "UTP Internacional"],
  // Pendiente (PLAN.md, sección 8): a quién escribir si alguien pierde su
  // código de canje después del evento.
  contactoSoporte: null,
  estado: "confirmado",
} satisfies Evento);

export default evento;
