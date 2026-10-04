# PROMPT-BADGE.md · Página /badge (Study Abroad Fest 2026)

Plan de implementación y prompt para Claude Code. Fecha de armado: 3 oct 2026. Evento: sáb 10 oct 2026.

---

## 1. Plantilla final (recibida 3 oct, lista)

- Archivo: 1080x1350, RGB sin transparencia. Guardar como `public/badge/plantilla.jpg` (versión optimizada de ~300 KB en vez del PNG de 1.6 MB).
- Mood y Ocupación vienen vacíos. "ESTUDIANTE" y el Mood se dibujan por código.
- El marco de foto trae un paisaje de relleno: no importa, la foto se dibuja encima y lo tapa.

Coordenadas medidas en la plantilla (píxeles):

- Foto: área x 164 a 464, y 721 a 1117 (radio 18) y luego se redibuja el borde magenta #AC0AAB de 6 px encima
- Nombre: x 485 a 917, y 742 a 814
- Ocupación: x 485 a 917, y 814 a 887
- Mood: x 701 a 917, y 960 a 1033
- Evento y Fecha ya vienen en la plantilla

---|---|---|
| Marco de foto | Tiene cielo/pasto de relleno pintado | Marco vacío (transparente o plano) |
| Casilla "Nombre:" | Vacía | Dejar vacía |
| Casilla "Mood" | Tiene "FELIZ" pintado | Vacía |
| Resolución | 1080x1350 | Ideal 2160x2700 (2x), mínimo 1080x1350 |
| Formato | PNG | PNG sin compresión agresiva (el fondo es una foto, pesa; revisar que quede < 1.5 MB, o exportar WebP/JPG de fondo + capa PNG aparte) |

Si no se puede exportar limpio, plan B: dibujar un parche del color del papel (#F3EEE4 aprox.) sobre el texto "FELIZ" y sobre el relleno del marco antes de pintar. Es frágil, mejor la plantilla limpia.

Archivo final a guardar: `public/badge/plantilla.png` (o `src/assets/badge/plantilla.png`).

Coordenadas APROXIMADAS medidas sobre el PNG de 1080x1350 (hay que medirlas exactas con la plantilla final y dejarlas en un solo objeto `SLOTS`):

- Foto: área x 164 a 464, y 721 a 1117 (radio 18) y luego se redibuja el borde magenta #AC0AAB de 6 px encima. La foto se dibuja encima y tapa el paisaje de relleno
- Nombre: x 485 a 917, y 742 a 814
- Ocupación: x 485 a 917, y 814 a 887 (vacía en la plantilla final: se dibuja "ESTUDIANTE" por código)
- Mood: x 701 a 917, y 960 a 1033
- Evento y Fecha ya vienen en la plantilla

---

## 2. Decisiones ya tomadas

- Solo asistentes. Otros roles los entrega el equipo.
- Lanzamiento ANTES del evento: texto en futuro ("voy a ser parte de").
- El badge se genera en el navegador con `<canvas>`. La foto original NUNCA se sube; solo se sube el badge final si la persona elige compartir.
- Mood es un selector. Opciones: FELIZ, A FULL, CON TODO, CON GANAS, MODO VIAJE.
- Compartir (CAMBIO 3 oct: método "enlace con vista previa", el que le funcionó a un amigo sin API):
  1. Al tocar "Compartir en LinkedIn", el navegador genera DOS imágenes: el badge 4:5 y una imagen horizontal 1200x627 (badge centrado sobre el cielo) para la vista previa de LinkedIn.
  2. Se suben a Vercel Blob y se crea una página propia `/b/<id>` con esa imagen como `og:image`.
  3. Se abre `https://www.linkedin.com/feed/?shareActive=true&text=<texto + enlace /b/<id>>`. LinkedIn abre el borrador con el texto ya escrito y la tarjeta del badge. La persona decide si publica.
  4. Quien entra a `/b/<id>` ve el badge y un botón "Inscríbete gratis" (Luma con UTM).
  - Respaldo: "Descargar imagen" (PNG 4:5, sin subir nada) y "Copiar texto".
- El texto del post lleva SOLO el enlace del badge (no el de Luma), porque LinkedIn arma la vista previa con un solo enlace. La inscripción va dentro de `/b/<id>`.
- Las menciones (@LEAD UTP, @UTP Internacional) no se pueden prellenar. La UI lo dice en una línea.
- Las imágenes subidas se borran después del evento (fecha propuesta: 31 oct 2026, pendiente de confirmar).
- La API de LinkedIn queda descartada: no hace falta para el borrador.

---

## 3. Plan por fases

### Fase 0 · Insumos (hoy, sáb 3 oct)
- [x] Plantilla final recibida
- [ ] Confirmar texto final del post
- [ ] Vercel Blob creado en el proyecto

### Fase 1 · Construcción (sáb 3 a dom 4 oct)
1. `src/data/site.ts`: relajar el esquema de `navLinks` para aceptar rutas (`/badge`) además de anclas (`#...`). Agregar "Mi badge" con marca NUEVO.
2. `src/pages/badge.astro` (estática, prerender), con `Base.astro`, `SiteNav` y `SiteFooter`.
3. `src/components/badge/`:
   - `BadgeStudio.astro` (UI: subir foto, nombre, mood, zoom/encuadre, vista previa, botones)
   - `badge-canvas.ts` (render en canvas, `SLOTS`, ajuste de nombre, recorte de foto)
   - `badge-share.ts` (subir, abrir LinkedIn con texto + enlace, descargar, copiar)
   - `src/pages/api/badge-upload.ts` (servidor: recibe las 2 imágenes, valida, sube a Vercel Blob, devuelve id)
   - `src/pages/b/[id].astro` (servidor: página pública del badge con `og:image`)
4. Sección `#badge` en la home, entre Passport (`#calendario`) y Arrive (`#llegar`), según el canvas de diseño.
5. Menú móvil, footer y (si corresponde) `DockMovil`: agregar "Mi badge".
6. Luma: usar `lumaUrl('badge_linkedin')` para el enlace dentro del texto del post.
7. Métricas opcionales: dos contadores en el Redis que ya existe (`badges_generados`, `badges_compartidos`) vía `api/badge-stat`, sin datos personales. Si complica, se omite y se usa Vercel Analytics con eventos.

### Fase 2 · Pruebas (dom 4 a lun 5 oct)
- [ ] Android Chrome: se abre la app o la web de LinkedIn con texto y tarjeta del badge
- [ ] iPhone Safari: igual
- [ ] Escritorio Chrome y Edge: igual
- [ ] Pasar un enlace `/b/<id>` por el LinkedIn Post Inspector (linkedin.com/post-inspector) y confirmar que muestra la imagen horizontal
- [ ] Probar un enlace `/b/<id>` inexistente: debe mostrar 404 amable
- [ ] Foto HEIC de iPhone, foto de 12 MB, foto horizontal y vertical
- [ ] Nombres: "Ana", nombre muy largo (30+ caracteres), con tilde y ñ
- [ ] Fuentes cargadas antes de dibujar (si no, el canvas sale con fuente de respaldo)
- [ ] Rutas existentes siguen igual: `/`, `/canje`, `/mi-calendario`, `npm run build`, `npm run check`

### Fase 3 · Lanzamiento (mar 6 a mié 7 oct, máximo)
- [ ] Deploy a producción
- [ ] Anuncio en redes y correo con el link `/badge`
- [ ] Revisar contadores/analytics el día del evento

### Fase 4 · Limpieza (después del evento)
- Borrar las imágenes de Vercel Blob en la fecha acordada (propuesta 31 oct) y desactivar `/b/<id>` (que redirija a la home).

---

## 4. Riesgos y qué hacer

| Riesgo | Mitigación |
|---|---|
| Fecha corta (evento el 10 oct) | Primero el generador + descarga (funciona solo). Luego el enlace con vista previa. Métricas al final |
| LinkedIn no muestra la imagen en la vista previa | `og:image` absoluta con https, 1200x627, < 5 MB, `og:image:width/height`; probar en Post Inspector |
| Alguien sube cualquier imagen a nuestro dominio | El servidor solo acepta PNG/JPG con medidas exactas (1080x1350 y 1200x627) y tamaño máximo; límite por IP con el Redis existente (ej. 10 por hora) |
| Privacidad de la foto | Casilla de aceptación antes de compartir; ids aleatorios no adivinables; `noindex` en `/b/<id>`; borrado después del evento |
| Vercel Blob no está configurado | Revisar en Vercel si existe el store y el `BLOB_READ_WRITE_TOKEN`; si no, crearlo (lo hace quien administra el proyecto en Vercel) |
| HEIC no se decodifica | `createImageBitmap` con respaldo; si falla, mensaje claro pidiendo JPG/PNG |
| Foto enorme | Reducir a 1600 px de lado largo antes de dibujar |
| Nombre largo se sale de la casilla | Reducir tamaño hasta que quepa, con mínimo; luego recortar con puntos suspensivos |
| Plantilla pesada | Servirla optimizada; cargarla solo en `/badge` |
| Falla la subida (sin señal, servidor caído) | Mensaje claro y ofrecer "Descargar imagen" + "Copiar texto" como salida |

---

## 5. PROMPT PARA CLAUDE CODE (copiar desde aquí)

```
Lee primero CLAUDE.md, VIAJE.md, PLAN.md (si existe), package.json, astro.config.mjs, src/lib/luma.ts, src/components/SiteNav.astro, src/components/SiteFooter.astro, src/components/DockMovil.astro, src/data/site.ts, src/pages/index.astro, src/layouts/Base.astro, src/components/canje/CanjeNav.astro, src/server/redis.ts y src/styles/global.css. No cambies nada hasta entender cómo está armado.

OBJETIVO
Crear la página /badge donde un ASISTENTE sube su foto, escribe su nombre, elige su "Mood", genera un badge tipo pasaporte (plantilla en public/badge/plantilla.png, 1080x1350 o 2160x2700) y lo comparte en LinkedIn con un texto listo. Debe verse igual al diseño actual "Viaje" (navbar flotante, footer, cielo/noche/atardecer, tokens y animaciones v-* existentes). Referencia visual: la carpeta docs/badge-diseno/ (lee su README.md primero). Ahí están la página /badge en escritorio y móvil, el badge sobre la plantilla real y la sección de la home. Copia distribución, jerarquía, tamaños y textos de ahí, pero usa los componentes reales del repo (SiteNav, SiteFooter, tokens, animaciones v-*). Si el diseño y este prompt no coinciden, manda este prompt.

REGLAS DEL PROYECTO
- Astro + Tailwind v4 + TypeScript estricto. /badge es estática (prerender). Solo dos piezas usan servidor (Vercel Functions, igual que mi-calendario y api/*): src/pages/api/badge-upload.ts y src/pages/b/[id].astro.
- Mobile first (360 y 390 px). Respetar prefers-reduced-motion.
- Commits en español con prefijo feat: / fix:. Antes de cada commit correr `npm run build` y `npm run check`.
- Prohibido usar guiones largos (em dash) ni medios (en dash) en textos dentro de src/.
- No inventes datos. Fecha del evento: sáb 10 oct 2026, 2:00 a 6:00 p.m., Centro de convenciones UTP, Jr. Hernán Velarde 260, Lima. Usa lo que ya está en src/data/evento.ts.

TAREAS (en este orden, un commit por tarea)
1. src/data/site.ts: ajustar el esquema Zod de navLinks para aceptar href que empiece con "#" o con "/". Agregar el link "Mi badge" (/badge) con etiqueta NUEVO. Que el SiteNav lo muestre en escritorio y en el menú móvil, y que desde páginas secundarias los anclas sigan funcionando (ej. "/#cronograma"). No romper /canje ni /mi-calendario.
2. Footer: agregar "Mi badge" en la columna que corresponda. DockMovil: agregarlo solo si encaja con su diseño actual; si no, omitirlo y decírmelo.
3. src/pages/badge.astro con Base.astro, SiteNav (variante consistente con las otras páginas secundarias) y SiteFooter. Title y description propios, imagen OG pensada para compartir.
4. src/components/badge/badge-canvas.ts:
   - Objeto SLOTS exportado. Medidas sobre la plantilla final de 1080x1350 (medidas en píxeles, verifícalas):
     - foto: x164 y721 w300 h396, radio 18 (probado sobre la plantilla). Orden de dibujo: 1) plantilla, 2) foto encima con encuadre cover, recortada (clip) a ese rectángulo redondeado, para tapar el paisaje de relleno del marco, 3) volver a trazar el borde magenta encima: roundRect x163 y719 w303 h399, radio 18, lineWidth 6, color #AC0AAB. Así no queda ninguna línea del paisaje visible.
     - nombre: caja x485 y742 a x917 y814. El rótulo "Nombre:" ocupa la parte superior izquierda; el valor va centrado en la franja inferior (aprox y778 a y808).
     - ocupacion: caja x485 y814 a x917 y887. La plantilla la trae VACÍA: dibujar "ESTUDIANTE" centrado en la franja inferior (aprox y850 a y880), con la misma tipografía y tamaño que "STUDY ABROAD FEST" de la fila Evento.
     - mood: caja x701 y960 a x917 y1033. Valor centrado en la franja inferior (aprox y995 a y1025).
     - Tipografía de los valores: serif tipo Arvo/Rockwell como en la plantilla (MAYÚSCULAS, espaciado amplio, color casi negro #1A1A1A). Si Arvo no está en el repo, agrégala con @fontsource/arvo.
     - Debe escalar si la plantilla es 2x.
   - Esperar a que las fuentes carguen (document.fonts.load) antes de dibujar.
   - Foto: leer con createImageBitmap, reducir a 1600 px de lado largo, encuadre cover con zoom y desplazamiento ajustables. Manejar HEIC fallido con mensaje claro (pedir JPG o PNG).
   - Nombre: mayúsculas, centrado, reducir tamaño hasta que quepa; mínimo legible; si aún no cabe, recortar con puntos suspensivos. Limitar a 40 caracteres.
   - Mood: texto centrado en su caja.
   - Exportar a Blob PNG (badge 1080x1350).
   - Segunda función: imagen horizontal 1200x627 para la vista previa de LinkedIn (fondo de cielo del diseño Viaje, badge centrado completo sin recortar, logo SAF y "10 OCT 2026"). Exportar como JPG calidad 0.88.
5. src/components/badge/BadgeStudio.astro (con script del lado cliente): UI con subir foto (input file, arrastrar y soltar en escritorio), campo de nombre, selector de Mood con las opciones FELIZ, A FULL, CON TODO, CON GANAS, MODO VIAJE, control de zoom, vista previa en vivo, y botones. Estados: vacío, foto cargada, generado, error. Accesible: labels, foco visible, aria-live para mensajes, botones de 44 px mínimo.
6. Subida y página pública del badge (servidor):
   - Instalar @vercel/blob. Revisa si BLOB_READ_WRITE_TOKEN existe en el entorno; si no, avísame y deja todo listo para cuando lo cree.
   - src/pages/api/badge-upload.ts (POST, multipart): recibe badge (PNG 1080x1350) y preview (JPG 1200x627). Valida tipo, medidas exactas y tamaño máximo (badge 4 MB, preview 1.5 MB). Límite por IP con el Redis existente (10 por hora). Genera un id aleatorio de 12 caracteres (no secuencial), sube ambos a Blob en badges/<id>/ y responde { id }. No guarda nombre, mood ni nada personal aparte de la imagen.
   - src/pages/b/[id].astro (SSR): busca el preview y el badge en Blob. Si existen, muestra el badge 4:5 con el diseño Viaje, título "Voy a Study Abroad Fest 2026", botón "Inscríbete gratis" con lumaUrl('badge_linkedin') y botón secundario "Crea tu badge" hacia /badge. Metas: og:title "Voy a Study Abroad Fest 2026", og:description corta del evento, og:image con URL absoluta https del preview, og:image:width 1200, og:image:height 627, twitter:card summary_large_image, y robots noindex. Si no existe, 404 con el diseño del sitio. Cache razonable (s-maxage).
7. src/components/badge/badge-share.ts:
   - Botón principal "Compartir en LinkedIn": pide aceptación (casilla, ver texto abajo), genera badge y preview, llama a /api/badge-upload, arma el enlace https://<dominio>/b/<id> y abre https://www.linkedin.com/feed/?shareActive=true&text=<texto codificado>. En móvil abrirlo en la misma pestaña (para que el sistema ofrezca la app); en escritorio, pestaña nueva. Mostrar estado "Preparando tu borrador..." mientras sube.
   - Como respaldo, copiar también el texto al portapapeles.
   - Botones secundarios: "Descargar imagen" (PNG 4:5, no sube nada) y "Copiar texto".
   - Si la subida falla: mensaje claro y resaltar "Descargar imagen".
   - Línea en la UI: "Al publicar, etiqueta a LEAD UTP y UTP Internacional."
   - Texto de la casilla de aceptación: "Acepto que mi badge se guarde en el sitio del evento para mostrarlo en LinkedIn. Se borra después del evento."
   - Línea de privacidad: "Tu foto original no se sube. Solo se guarda el badge si eliges compartirlo."
   - Texto del post (exacto, sin guiones largos). Lleva un solo enlace, el del badge, para que LinkedIn arme la vista previa con él:
     "Este 10 de octubre voy a ser parte de Study Abroad Fest 2026, una tarde para convertir el interés por estudiar en el extranjero en un camino concreto.

     Becas, intercambios y orientación directa con instituciones internacionales. Organiza LEAD UTP · Pilar de Excelencia Académica, en alianza con UTP Internacional.

     ¿También quieres estudiar afuera? Inscríbete gratis aquí: https://<dominio>/b/<id>

     #StudyAbroadFest #LEADUTP #UTPInternacional #Becas #EstudiarEnElExtranjero"
   - "Copiar texto" (sin compartir) usa la misma plantilla pero con lumaUrl('badge_linkedin') en lugar del enlace del badge.
8. Sección #badge en src/pages/index.astro, entre Passport (#calendario) y Arrive (#llegar), como componente nuevo src/components/viaje/BadgeSeccion.astro: etiqueta "Nuevo · Para asistentes", título "Tu pasaporte para LinkedIn", subtítulo "Crea tu badge con tu foto y tu nombre, y cuéntale a tu red que vas.", mockup del badge con la animación v-float, CTA "Crear mi badge" hacia /badge. Mismo fondo y tratamiento visual que las secciones vecinas.
9. (Opcional, solo si no complica) contadores en Redis: api/badge-stat con POST { evento: "generado" | "compartido" }, que haga INCR en badges_generados / badges_compartidos. Sin datos personales, sin cookies. Si prefieres no tocar servidor, usa eventos de Vercel Analytics. Dime cuál elegiste.

CRITERIOS DE ACEPTACIÓN
- /badge funciona en Android Chrome, iPhone Safari y escritorio sin errores en consola.
- Al tocar "Compartir en LinkedIn", se abre LinkedIn con el texto escrito y la tarjeta del badge (verificado con LinkedIn Post Inspector sobre un /b/<id> real).
- La foto original nunca se envía (pestaña Red): solo viajan el badge final y el preview, y solo tras aceptar la casilla. "Descargar imagen" no hace ninguna petición.
- /api/badge-upload rechaza archivos con medidas o tipos distintos y respeta el límite por IP.
- Nombre largo (40 caracteres) y con tildes/ñ se ve bien.
- Sin foto no se puede generar; con foto sin nombre tampoco.
- `npm run build` y `npm run check` pasan. Ninguna ruta existente se rompe.
- Cero guiones largos o medios en src/.
- Lighthouse móvil de /badge: accesibilidad >= 95.

AL TERMINAR
Dame: lista de archivos creados y modificados, qué decidiste en las tareas 2 y 9, si falta configurar algo en Vercel (Blob, variables), capturas o descripción de cómo se ve en 390 px, y lo que quedó pendiente.

NO HAGAS
- Integración con la API de LinkedIn ni inicio de sesión con LinkedIn.
- Guardar nombres, correos o cualquier dato aparte de las dos imágenes.
- El borrado automático post evento (lo hacemos aparte).
```

---

## 6. Checklist de lanzamiento

- [ ] Plantilla en el repo (`public/badge/plantilla.jpg`)
- [ ] Texto del post aprobado por LEAD UTP y UTP Internacional
- [ ] Probado en 3 dispositivos (Android, iPhone, escritorio)
- [ ] Link del post con UTM funcionando en Luma
- [ ] Anuncio listo (redes y correo) con enlace a /badge
- [ ] Alguien del equipo prueba el flujo completo desde cero con su propia foto

## 7. Pendientes tuyos

1. Copiar `plantilla.jpg` a `public/badge/` del repo.
2. Crear el store de Vercel Blob en el proyecto (o pedírselo a quien administra Vercel).
3. Confirmar la fecha de borrado de las imágenes (propuesta: 31 oct 2026).
4. Confirmar que las 5 opciones de Mood te gustan.
5. Pedirle a tu amigo una captura de su borrador en LinkedIn para comparar el resultado.
6. Compartir el canvas de diseño con quien lo necesite (es privado hasta que lo compartas desde su menú Compartir).
