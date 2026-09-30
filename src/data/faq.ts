import { FaqItemSchema, type FaqItem } from "./schema";

// Respuestas derivadas de datos ya confirmados en otros lados de
// src/data/ y de CLAUDE.md (nunca se inventa un dato nuevo aquí).
const faqRaw: FaqItem[] = [
  {
    pregunta: "¿Para quién es el evento?",
    respuesta: "Para estudiantes UTP, pensado principalmente para quienes están desde 5.º ciclo.",
    estado: "confirmado",
  },
  {
    pregunta: "¿Tiene costo?",
    respuesta: "No. El ingreso es gratuito, solo necesitas inscribirte antes en Luma.",
    estado: "confirmado",
  },
  {
    pregunta: "¿Los ponentes internacionales van en persona?",
    respuesta: "Depende del bloque. El cronograma marca si es presencial, un video o una conexión por Zoom.",
    estado: "confirmado",
  },
  {
    pregunta: "¿Dónde pregunto por requisitos de una beca?",
    respuesta:
      "En los stands de UTP Internacional, EducationUSA, APEBEMO y Migajeando Becas, abiertos durante todo el evento.",
    estado: "confirmado",
  },
  {
    pregunta: "¿Cómo consigo el Calendario de becas?",
    respuesta:
      "Recorre los stands del evento, junta un sello en cada uno y canjéalos por un código en la mesa de canje. Con ese código desbloqueas el calendario en /canje.",
    estado: "confirmado",
  },
];

const faq: FaqItem[] = faqRaw.map((f) => FaqItemSchema.parse(f));

export default faq;
