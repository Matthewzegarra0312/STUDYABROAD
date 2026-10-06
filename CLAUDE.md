# Study Abroad Fest 2026 · Web del evento

Página oficial del evento Study Abroad Fest. **Proyecto nuevo, construido desde cero**: repo y deploy propios, sin código, dependencias ni componentes de otros proyectos. Lo único que existe antes de empezar es `design/` y estos dos archivos.

Lee `PLAN.md` antes de empezar cualquier fase. **El diseño final está en `design/canvas/*.dc.html`** (exportado del canvas de diseño; son HTML con estilos inline, úsalos como referencia visual exacta). `design/referencia-landing.html` es solo la primera versión. El key visual está en `design/key-visual.png`.

## Qué es el evento

- **Nombre:** Study Abroad Fest
- **Organiza:** LEAD UTP · Pilar de Excelencia Académica, en alianza con UTP Internacional
- **Fecha:** sábado 10 de octubre de 2026, 2:00 a 6:00 p.m. (hora de Lima, UTC-5)
- **Lugar:** Convention Center UTP, Av. Petit Thouars 116, Lima
- **Ingreso:** gratuito con inscripción previa en Luma: https://luma.com/txyuybq9?tk=pwCvrY
- **Público:** estudiantes UTP, principalmente desde 5.º ciclo
- **Principio:** convertir el interés de un estudiante por estudiar en el extranjero en un camino concreto hacia una oportunidad real

## Propósito de la web

1. Ver **todo sobre el evento** en una sola página principal, con el **cronograma** como pieza central.
2. Dar el **Calendario de becas** (convocatorias, fechas, tips, PDF y .ics) **solo a asistentes presenciales**, mediante el pasaporte de sellos y un código de canje (ver PLAN.md sección 2).
3. Llevar a la inscripción en Luma.

## Reglas de contenido (obligatorias)

1. **No inventar datos.** Nada de horarios, fechas de convocatorias, cargos, cifras, aforos, logos o testimonios que no estén en `src/data/`. Si falta un dato, se muestra "Por anunciar" o no se muestra.
2. **Cada dato en `src/data/` lleva un `estado`:** `confirmado` | `por-confirmar`. Solo lo `confirmado` se publica, salvo que el componente muestre explícitamente "Por anunciar".
3. **No mostrar el aforo** ni ninguna cifra de capacidad.
4. **Embajada de Japón en el Perú: no aparece** como stand ni organizador. La Beca MEXT sí se presenta en el cronograma, a cargo de **APEBEMO** (Asociación Peruana de Becarios del Gobierno de Japón).
5. **Panel de ex-becarios:** comparten solo experiencia personal. Toda copy que los mencione debe redirigir las dudas oficiales (requisitos, procesos, convocatorias) a los stands. No escribir que en el panel se resuelven requisitos.
6. **Ponencias internacionales:** vlog pregrabado + preguntas en vivo vía Zoom. No describirlas como "presenciales".
7. **Nunca usar el guion largo (—) ni el guion medio como separador** en la copy. Usar punto, coma, dos puntos o "·".
8. Tono: joven, internacional, aspiracional, profesional y accesible. Español de Perú, tuteo. Evitar lenguaje corporativo y promesas exageradas.
9. El brochure de pitch **no es fuente de verdad**. La fuente es `src/data/` y lo que confirme el equipo.
10. **Contenido protegido:** las fechas de convocatorias, los enlaces oficiales, los tips, el PDF y el .ics de cierres **nunca** van en `public/`, en páginas prerenderizadas ni en JavaScript del cliente. Solo se entregan desde rutas de servidor que validan la cookie del canje. Los códigos en texto plano nunca se suben al repo.

## Identidad visual

Estilo collage de papel recortado: capas, bordes blancos gruesos, sombras suaves de "papel levantado", leve rotación en tarjetas.

| Token | Hex | Uso |
|---|---|---|
| `sky` | `#3B99D8` | Fondo principal |
| `sky-deep` | `#2F86C4` | Chips "Zoom", acentos sobre cielo |
| `sky-soft` | `#CFE6F6` | Callouts, avatares vacíos |
| `magenta` | `#AC0BAD` | Inicio del degradado |
| `violet` | `#6258BB` | Fin del degradado, títulos, enlaces |
| `paper` | `#FDFEFC` | Superficies, bordes recortados |
| `paper-2` | `#F1F3FA` | Secciones alternas |
| `road` | `#525F97` | Caminos, chips secundarios |
| `lav` | `#ABAEC8` | Bordes y separadores |
| `ink` | `#1D2152` | Texto principal, footer |
| `ink-2` | `#4A507C` | Texto secundario |

- Degradado de marca: `linear-gradient(100deg, magenta, violet)` para botones y el recuadro "FEST".
- Tipografías: **Lilita One** (display, títulos), **Figtree** (texto), **IBM Plex Mono** (etiquetas, datos tipo pase de abordaje). Self-host con `@fontsource`. Si diseño entrega la tipografía oficial del logo, reemplaza Lilita One.
- Motivo central: **los caminos de papel** que convergen. El cronograma se dibuja como un camino con paradas.
- Detalles del mundo del viaje: tarjetas de ponentes como etiquetas de equipaje, info práctica como pase de abordaje, sellos con código de país (MX, US, EU, CN). Sin emojis de banderas.
- Una sola apariencia (no hay modo oscuro).
- Respetar `prefers-reduced-motion`. Animaciones solo en CSS.

## Convenciones técnicas

- Astro (última versión estable, `npm create astro@latest`) + Tailwind CSS v4 + TypeScript estricto.
- Páginas prerenderizadas por defecto. Solo `mi-calendario` y `api/*` corren en Vercel Functions (`export const prerender = false`).
- Variables de entorno: `CANJE_SECRET` y las de Upstash Redis. Nunca en el código.
- Contenido en `src/data/*.ts` tipado y validado con Zod. Los componentes nunca tienen texto de datos hardcodeado.
- Mobile first: la mayoría del tráfico llega desde Instagram y WhatsApp. Probar a 360 px y 390 px.
- Todo CTA de inscripción usa el helper `lumaUrl(source)` que agrega UTM.
- Commits pequeños por fase, en español, formato `feat: …`, `fix: …`, `content: …`.
- Antes de cerrar una fase: `npm run build` sin errores y `npm run check`.
