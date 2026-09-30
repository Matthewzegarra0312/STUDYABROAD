import { PonenteSchema, type Ponente } from "./schema";

// Cuando lleguen las fotos autorizadas (PLAN.md, sección 6), se agrega
// `imagen: "carmen.jpg"` (etc.) apuntando a src/assets/ponentes/.
const ponentesRaw: Ponente[] = [
  {
    id: "carmen",
    nombre: "Carmen",
    institucion: "Tecnológico de Monterrey",
    codigoPais: "MX",
    meta: "México",
    grupo: "internacional",
    // Ya no aparece en el cronograma confirmado; pendiente de confirmar si
    // sigue participando (PLAN.md, sección 8). No se borra su ficha.
    estado: "por-confirmar",
  },
  {
    id: "fernando-injoque",
    nombre: "Fernando Injoque",
    institucion: "Purdue University",
    codigoPais: "US",
    meta: "Estados Unidos",
    grupo: "internacional",
    imagen: "fernando-injoque.jpg",
    estado: "confirmado",
  },
  {
    id: "ivanna",
    nombre: "Ivanna Yllahuaman",
    institucion: "Purdue University",
    codigoPais: "US",
    meta: "Estados Unidos",
    grupo: "internacional",
    imagen: "ivanna.png",
    estado: "confirmado",
  },
  {
    id: "mila",
    nombre: "Milagros Virhuez",
    institucion: null,
    codigoPais: "JP",
    meta: "Mila en Japón",
    grupo: "internacional",
    estado: "confirmado",
  },
  {
    id: "guillermo-gonzalo",
    nombre: "Guillermo Gonzalo",
    institucion: "Erasmus+",
    codigoPais: "EU",
    meta: "Europa",
    grupo: "internacional",
    imagen: "guillermo-gonzalo.png",
    estado: "confirmado",
  },
  {
    id: "raquel-sanchez",
    nombre: "Raquel Sánchez",
    institucion: "Erasmus Mundus",
    codigoPais: "EU",
    meta: "Europa",
    grupo: "internacional",
    estado: "confirmado",
  },
  {
    id: "leslie-sanchez",
    nombre: "Leslie Sánchez",
    institucion: "UC Berkeley",
    codigoPais: "US",
    meta: "Beca culminada",
    grupo: "panel",
    imagen: "leslie-sanchez.png",
    estado: "confirmado",
  },
  {
    id: "diego-mendoza",
    nombre: "Diego Mendoza",
    institucion: "UC Berkeley",
    codigoPais: "US",
    meta: "Estados Unidos",
    // Presenta el bloque de Berkeley Haas, en persona. No está en el
    // panel de exbecarios de las 15:45.
    grupo: "panel",
    imagen: "Diego-Mendoza.png",
    estado: "confirmado",
  },
  {
    id: "giancarlo-carmelino",
    nombre: "Giancarlo Carmelino",
    institucion: "Study in Japan",
    codigoPais: "JP",
    meta: "Japón",
    grupo: "internacional",
    estado: "confirmado",
  },
  {
    id: "marlon-hugas",
    nombre: "Marlon Hugas",
    institucion: "Beca ELAP",
    codigoPais: null,
    meta: null,
    grupo: "panel",
    estado: "confirmado",
  },
  {
    id: "gresly-ruiz",
    nombre: "Gresly Ruiz",
    institucion: "Berkeley",
    codigoPais: "US",
    meta: "Estados Unidos",
    grupo: "panel",
    estado: "confirmado",
  },
  {
    id: "diego-river",
    nombre: "Diego River",
    institucion: "Harvard",
    codigoPais: "US",
    meta: "Estados Unidos",
    grupo: "panel",
    estado: "confirmado",
  },
  {
    id: "joshua-galvez",
    nombre: "Joshua Eduardo Valentino Galvez Peña",
    institucion: "Tecnológico de Monterrey",
    codigoPais: "MX",
    meta: "México",
    grupo: "panel",
    estado: "confirmado",
  },
  {
    id: "lizbeth-davila",
    nombre: "Lizbeth Dávila",
    institucion: "ELAP · SIAS",
    codigoPais: "CN",
    meta: "China",
    grupo: "panel",
    // Ya no aparece en el cronograma confirmado; pendiente de confirmar si
    // sigue participando (PLAN.md, sección 8). No se borra su ficha.
    imagen: "lizbeth-davila.JPG",
    estado: "por-confirmar",
  },
];

const ponentes: Ponente[] = ponentesRaw.map((p) => PonenteSchema.parse(p));

export default ponentes;
