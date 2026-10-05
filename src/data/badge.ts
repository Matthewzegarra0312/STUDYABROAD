import { z } from "zod";

// Enlace de inscripción que va en el texto copiado (no en el borrador de LinkedIn).
export const enlaceInscripcionPost = z.url().parse("https://studyabroad.leadutp.org/");

// Texto del post de LinkedIn (PROMPT-BADGE.md, tarea 7). {enlace} se reemplaza
// por el enlace del badge (/b/<id>) al compartir, o por enlaceInscripcionPost al
// copiar el texto. Lleva un solo enlace para que LinkedIn arme la vista previa con él.
export const plantillaPost = z.string().parse(
  `Este 10 de octubre estaré en Study Abroad Fest 2026 🌍✈️
Una tarde para convertir el interés por estudiar en el extranjero en un camino concreto.

🎓 Becas y convocatorias abiertas
🔁 Programas de intercambio
🤝 Orientación directa con instituciones internacionales

Organiza LEAD UTP · Pilar de Excelencia Académica, en alianza con UTP Internacional 💙

¿También quieres estudiar afuera? Inscríbete gratis aquí 👇
{enlace}

Nos vemos ahí 🙌

#StudyAbroadFest #LEADUTP #UTPInternacional #Becas #EstudiarEnElExtranjero`,
);

// Pasos de la sección #badge de la home (docs/badge-diseno/Home-Seccion-*.dc.html).
export const pasosBadge = z
  .array(z.object({ title: z.string() }))
  .length(3)
  .parse([{ title: "Sube tu foto" }, { title: "Escribe tu nombre" }, { title: "Comparte en LinkedIn" }]);
