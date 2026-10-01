import { StandSchema, type Stand } from "./schema";

// Los 4 stands que sellan el pasaporte. La Embajada de Japón no aparece
// (CLAUDE.md, regla 4). APEBEMO sigue en el cronograma con la Beca MEXT,
// pero ya no es stand.
const standsRaw: Stand[] = [
  {
    id: "utp-internacional",
    nombre: "UTP Internacional",
    descripcion: "Convenios, promedios requeridos, convalidación de cursos y visados.",
    logo: "utp-logo.png",
    logoClaro: true,
    fondo: "fondo-stand-utp-internacional.png",
    url: "https://www.utp.edu.pe/internacional-utp",
    estado: "confirmado",
  },
  {
    id: "educationusa",
    nombre: "EducationUSA",
    descripcion: "Universidades, admisiones y becas para estudiar en Estados Unidos.",
    logo: "Education-USA-Star-Torch-Logo.png",
    fondo: "fondo-stand-education-usa.png",
    url: "https://educationusa.state.gov/",
    estado: "confirmado",
  },
  {
    id: "study-in-japan",
    nombre: "Study in Japan",
    descripcion: null,
    logo: "Japanese-Brush-Study-in-Japan.png",
    fondo: "fondo-stand-study-in-japan.png",
    url: "https://www.estudenojapao.com/es",
    estado: "confirmado",
  },
  {
    id: "erasmus-mundus",
    nombre: "Erasmus Mundus",
    descripcion: null,
    logo: "Erasmus-Mundus-Association-Perú-Logo.png",
    fondo: "fondo-stand-erasmus-mundus.png",
    url: "https://www.instagram.com/erasmusmundus.peru/",
    estado: "confirmado",
  },
];

const stands: Stand[] = standsRaw.map((s) => StandSchema.parse(s));

export default stands;
