# Diseño de referencia · /badge (SAF 2026)

Diseño aprobado de la página `/badge` y de la entrada desde la home. Es SOLO referencia visual: no se importa, no se compila y no va a producción.

## Archivos

| Archivo | Qué muestra |
|---|---|
| `Main.dc.html` | `/badge` en escritorio (1440 px): hero, formulario (foto, nombre, mood, casilla de aceptación), vista previa, botones, sección "Tu post en LinkedIn", CTA final, footer |
| `Mobile-Badge.dc.html` | `/badge` en móvil (390 px), con la barra fija inferior "Compartir en LinkedIn" + descargar |
| `Badge.dc.html` | El badge sobre la plantilla real, con las coordenadas de producción (lienzo 1080x1350 escalado) |
| `Home-Seccion-Desktop.dc.html` | Navbar con "Mi badge" + etiqueta NUEVO y la sección `#badge` de la home |
| `Home-Seccion-Mobile.dc.html` | Menú móvil abierto con "Mi badge" y la sección `#badge` |
| `assets/prueba-coordenadas.png` | Prueba de que foto, nombre, ocupación y mood calzan en la plantilla |

## Cómo leerlos

- Son HTML con estilos en línea: los colores, tamaños, espaciados y textos se leen directo del código.
- Las etiquetas `<x-dc>`, `<sc-if>`, `<sc-for>`, `<dc-import>` y `{{...}}` son del editor de diseño. Ignóralas: en Astro se reemplazan por componentes y lógica normales.
- `support.js` no existe en el repo. Si abres el archivo en el navegador no se verá completo; lee el código.
- Los navbar y footer del diseño son una COPIA de `SiteNav` y `SiteFooter`. En producción se usan los componentes reales, no se copian.

## Si hay diferencias

Manda `PROMPT-BADGE.md` (sección 5). Textos que en el diseño aparecen como `[enlace de tu badge]` se generan en producción (`https://<dominio>/b/<id>`).
