import { z } from "zod";

// Texto del post de LinkedIn (PROMPT-BADGE.md, tarea 7). {enlace} se reemplaza
// por el enlace del badge (/b/<id>) al compartir, o por el de Luma al copiar el
// texto. Lleva un solo enlace para que LinkedIn arme la vista previa con él.
export const plantillaPost = z.string().parse(
  `Este 10 de octubre voy a ser parte de Study Abroad Fest 2026, una tarde para convertir el interés por estudiar en el extranjero en un camino concreto.

Becas, intercambios y orientación directa con instituciones internacionales. Organiza LEAD UTP · Pilar de Excelencia Académica, en alianza con UTP Internacional.

¿También quieres estudiar afuera? Inscríbete gratis aquí: {enlace}

#StudyAbroadFest #LEADUTP #UTPInternacional #Becas #EstudiarEnElExtranjero`,
);
