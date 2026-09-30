import { PostulacionSchema, type Postulacion } from "./schema";

// Nombre de la convocatoria e institución son públicos. Fechas, enlace
// oficial y "dónde preguntar" (cuando falte) quedan en null hasta que
// UTP Internacional y EducationUSA los confirmen (PLAN.md, sección 8:
// bloquea "Fechas y enlace oficial de cada convocatoria", 5 oct).
const postulacionesRaw: Postulacion[] = [
  {
    id: "utp-internacional",
    programa: "Movilidad UTP Internacional",
    destino: "Universidades con convenio",
    codigoPais: "UTP",
    institucion: "UTP Internacional",
    apertura: null,
    cierre: null,
    urlOficial: null,
    dondePreguntar: "Stand UTP Internacional",
    estado: "por-confirmar",
    verificadoEl: null,
  },
  {
    id: "fulbright",
    programa: "Beca Fulbright",
    destino: "Estados Unidos",
    codigoPais: "US",
    institucion: "EducationUSA",
    apertura: null,
    cierre: null,
    urlOficial: null,
    dondePreguntar: "Stand EducationUSA",
    estado: "por-confirmar",
    verificadoEl: null,
  },
  {
    id: "erasmus-plus",
    programa: "Erasmus+",
    destino: "Europa",
    codigoPais: "EU",
    institucion: "Erasmus+",
    apertura: null,
    cierre: null,
    urlOficial: null,
    dondePreguntar: null,
    estado: "por-confirmar",
    verificadoEl: null,
  },
  {
    id: "mext",
    programa: "Beca MEXT",
    destino: "Japón",
    codigoPais: "JP",
    institucion: "APEBEMO",
    // No se inventan fechas ni enlace oficial para APEBEMO (pendiente,
    // PLAN.md sección 8).
    apertura: null,
    cierre: null,
    urlOficial: null,
    // APEBEMO ya no es stand. No se inventa otro lugar hasta confirmarlo.
    dondePreguntar: null,
    estado: "por-confirmar",
    verificadoEl: null,
  },
];

const postulaciones: Postulacion[] = postulacionesRaw.map((p) => PostulacionSchema.parse(p));

export default postulaciones;
