import {
  FaqItemSchema,
  GateSchema,
  ScheduleBreakSchema,
  AllyLinkSchema,
  ScheduleGroupSchema,
  SpeakerSchema,
  type FaqItem,
  type Gate,
  type ScheduleBreak,
  type ScheduleGroup,
  type Speaker,
} from "./schema";
import stands from "./stands";

// Cronograma confirmado (documento del equipo, 30 sep 2026).
// Modalidades de esa fuente: presencial, video y Zoom en vivo.
// "vlog-zoom" es la cápsula en video. No se describe como presencial
// (CLAUDE.md, regla 6). La Beca MEXT la presenta APEBEMO, no una embajada
// (regla 4). El panel cuenta experiencia personal (regla 5).
const groupsRaw: ScheduleGroup[] = [
  {
    n: 1,
    title: "Voces internacionales",
    from: "14:00",
    to: "14:25",
    rows: [
      { start: "14:00", end: "14:05", title: "Cápsula internacional", who: "Fernando Injoque, Purdue University", mode: "vlog-zoom" },
      { start: "14:05", end: "14:25", title: "Experiencia de intercambio en Purdue University", who: "Ivanna Yllahuaman", mode: "presencial" },
    ],
  },
  {
    n: 2,
    title: "Oportunidades internacionales y becas",
    from: "14:25",
    to: "15:45",
    rows: [
      { start: "14:25", end: "14:55", title: "Convenios, requisitos y movilidad internacional", who: "UTP Internacional", mode: "presencial" },
      { start: "14:55", end: "15:25", title: "Berkeley Haas Global Access Program", who: "Leslie Sánchez y Diego Mendoza, UC Berkeley · conexión internacional", mode: "presencial" },
      { start: "15:25", end: "15:45", title: "Beca Fulbright", who: "EducationUSA", mode: "presencial" },
    ],
  },
  {
    n: 3,
    title: "Panel de exbecarios",
    from: "15:45",
    to: "16:05",
    rows: [
      {
        start: "15:45",
        end: "16:05",
        title: "Panel de exbecarios",
        who: "Marlon Ugaz (ELAP), Leslie Sánchez (Berkeley), Diego Rivera (Harvard) y Joshua Galvez (Tecnológico de Monterrey)",
        mode: "presencial",
      },
    ],
  },
  {
    n: 4,
    title: "Japón: Study in Japan y Beca MEXT",
    from: "16:05",
    to: "17:00",
    rows: [
      { start: "16:05", end: "16:10", title: "Cápsula: estudiar en Japón", who: "Milagros Virhuez, Mila en Japón", mode: "vlog-zoom" },
      { start: "16:10", end: "16:30", title: "Study in Japan", who: "Giancarlo Carmelino", mode: "zoom" },
      { start: "16:30", end: "17:00", title: "Beca MEXT: experiencia de un exbecario", who: "APEBEMO", mode: "presencial" },
    ],
  },
  {
    n: 5,
    title: "Erasmus+, Erasmus Mundus y ELAP",
    from: "17:10",
    to: "17:55",
    rows: [
      { start: "17:10", end: "17:15", title: "Cápsula Erasmus+", who: "Guillermo Gonzalo", mode: "vlog-zoom" },
      { start: "17:15", end: "17:40", title: "Experiencia Erasmus Mundus", who: "Raquel Sánchez, exbecaria Erasmus Mundus", mode: "zoom" },
      { start: "17:40", end: "17:55", title: "Emerging Leaders in the Americas Program (ELAP)", who: "Lizbeth Dávila", mode: "presencial" },
    ],
  },
  {
    n: 6,
    title: "Migajeando Oportunidades",
    from: "17:55",
    to: "18:00",
    rows: [
      { start: "17:55", end: "18:00", title: "Migajeando Oportunidades", who: "Raúl Jáuregui", mode: "presencial" },
    ],
  },
];

export const groups = groupsRaw.map((group) => ScheduleGroupSchema.parse(group));

export const intermission: ScheduleBreak = ScheduleBreakSchema.parse({
  start: "17:00",
  end: "17:10",
  title: "Intermedio y networking",
});

/** Aviso de la fuente del cronograma. Las mesas de consulta siguen abiertas en ese espacio. */
export const notaCronograma =
  "Los horarios y participantes pueden ajustarse a último momento. Las mesas de consulta siguen abiertas en el intermedio.";

// ---------------------------------------------------------------------------
// Ponentes (tarjetas tipo pase de abordaje). La hora es la de su primera
// actividad en el cronograma. "vlog-zoom" = cápsula en video, "zoom" = Zoom
// en vivo. Quien comparte experiencia personal no resuelve requisitos
// (CLAUDE.md, regla 5): eso queda en los stands.
// ---------------------------------------------------------------------------
const speakersRaw: Speaker[] = [
  { id: "fernando-injoque", initials: "FI", code: "US", name: "Fernando Injoque", institution: "Purdue University", mode: "vlog-zoom", time: "14:00", estado: "confirmado", imagen: "fernando-injoque.jpg", url: "https://www.linkedin.com/in/ferinjoque/" },
  { id: "ivanna", initials: "IY", code: "US", name: "Ivanna Yllahuaman", institution: "Purdue University", mode: "experiencia", time: "14:05", estado: "confirmado", imagen: "ivanna.png", url: "https://www.linkedin.com/in/ivanna-yllahuaman/" },
  { id: "leslie-sanchez", initials: "LS", code: "US", name: "Leslie Sánchez", institution: "UC Berkeley", mode: "experiencia", time: "14:55", estado: "confirmado", imagen: "leslie-sanchez.png", url: "https://www.instagram.com/leslie_sanchezm14/" },
  { id: "diego-mendoza", initials: "DM", code: "US", name: "Diego Mendoza", institution: "UC Berkeley", mode: "experiencia", time: "14:55", estado: "confirmado", imagen: "Diego-Mendoza.png", url: "https://www.linkedin.com/in/diegomendozaflores/" },
  { id: "marlon-ugaz", initials: "MU", code: "CA", name: "Marlon Ugaz", institution: "Beca ELAP", mode: "experiencia", time: "15:45", estado: "confirmado", imagen: "marlon-ugaz.png", url: "https://www.linkedin.com/in/marlon-ugaz-079519258/" },
  { id: "diego-river", initials: "DR", code: "US", name: "Diego Rivera", institution: "Harvard", mode: "experiencia", time: "15:45", estado: "confirmado", imagen: "diego-rivera.png", url: "https://www.linkedin.com/in/diego-rivera-balarezo-4635b5124/" },
  { id: "joshua-galvez", initials: "JG", code: "MX", name: "Joshua Galvez", institution: "Tecnológico de Monterrey", mode: "experiencia", time: "15:45", estado: "confirmado", imagen: "joshua-galvez.png", url: "https://www.linkedin.com/in/joshua-eduardo-valentino-galvez-pe%C3%B1a-93b149233/" },
  { id: "mila", initials: "MV", code: "JP", name: "Milagros Virhuez", institution: "Mila en Japón", mode: "vlog-zoom", time: "16:05", estado: "confirmado", imagen: "milagros-virhuez.png", url: "https://www.instagram.com/milaenjapon/" },
  { id: "giancarlo-carmelino", initials: "GC", code: "JP", name: "Giancarlo Carmelino", institution: "Study in Japan", mode: "zoom", time: "16:10", estado: "confirmado", imagen: "giancarlo-carmelino.png", url: "https://www.linkedin.com/in/giancarlo-carmelino-76406716/" },
  { id: "guillermo-gonzalo", initials: "GG", code: "EU", name: "Guillermo Gonzalo", institution: "Erasmus+", mode: "vlog-zoom", time: "17:10", estado: "confirmado", imagen: "guillermo-gonzalo.png", url: "https://www.instagram.com/gonzalfarooo/" },
  { id: "raquel-sanchez", initials: "RS", code: "EU", name: "Raquel Sánchez", institution: "Erasmus Mundus", mode: "zoom", time: "17:15", estado: "confirmado", imagen: "raquel-sanchez.png", url: "https://www.instagram.com/raquel.powerade/" },
  { id: "lizbeth-davila", initials: "LD", code: "CA", name: "Lizbeth Dávila", institution: "Beca ELAP", mode: "experiencia", time: "17:40", estado: "confirmado", imagen: "lizbeth-davila.png", url: "https://www.linkedin.com/in/lizbethd%C3%A1vilad%C3%A1vila/" },
  { id: "raul-jauregui", initials: "RJ", code: "PE", name: "Raúl Jáuregui", institution: "Migajeando Oportunidades", mode: "experiencia", time: "17:55", estado: "confirmado", imagen: "Raúl-Jauregui.png", url: "https://www.instagram.com/rauenciencia/" },
];

export const speakers = speakersRaw.map((s) => SpeakerSchema.parse(s));

// ---------------------------------------------------------------------------
// Puertas de embarque = los 4 stands que sellan el pasaporte.
// ---------------------------------------------------------------------------
const gatesRaw: Gate[] = [
  { n: 1, standId: "utp-internacional", name: "UTP Internacional", color: "violet", estado: "confirmado" },
  { n: 2, standId: "educationusa", name: "EducationUSA", color: "magenta", estado: "confirmado" },
  { n: 3, standId: "study-in-japan", name: "Study in Japan", color: "road", estado: "confirmado" },
  { n: 4, standId: "erasmus-mundus", name: "Erasmus Mundus", color: "sky-deep", estado: "confirmado" },
];

export const gates = gatesRaw.map((g) => {
  const gate = GateSchema.parse(g);
  if (!stands.some((s) => s.id === gate.standId)) {
    throw new Error(`Puerta ${gate.n}: no existe el stand "${gate.standId}" en stands.ts`);
  }
  return gate;
});

/** Aliados del programa que se muestran bajo las puertas. */
export const allies = [
  { name: "Erasmus+", url: null },
].map((a) => AllyLinkSchema.parse(a));

// ---------------------------------------------------------------------------
// FAQ de "Pase de abordaje": las 4 preguntas del diseño más la del Calendario
// de becas (PLAN.md, sección 4).
// ---------------------------------------------------------------------------
const faqRaw: FaqItem[] = [
  { pregunta: "¿Para quién es el evento?", respuesta: "Para estudiantes UTP, pensado principalmente para quienes están desde 5.º ciclo.", estado: "confirmado" },
  { pregunta: "¿Tiene costo?", respuesta: "No. Es gratis, con inscripción previa en Luma.", estado: "confirmado" },
  { pregunta: "¿Los ponentes internacionales van en persona?", respuesta: "Depende del bloque. El cronograma marca si es presencial, un video o una conexión por Zoom.", estado: "confirmado" },
  { pregunta: "¿Dónde pregunto por requisitos de una beca?", respuesta: "En los stands. Los ponentes cuentan su experiencia personal, no los requisitos oficiales.", estado: "confirmado" },
  { pregunta: "¿Cómo consigo el Calendario de becas?", respuesta: "Abre tu pasaporte digital con el código de tu pase de abordaje y junta un sello en cada stand escaneando su QR. Con el pasaporte completo, la mesa de canje te entrega un código con el que desbloqueas el calendario en la web.", estado: "confirmado" },
];

export const faq = faqRaw.map((f) => FaqItemSchema.parse(f));
