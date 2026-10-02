# CONTEXT.md · Study Abroad Fest 2026

Resumen completo del proyecto para quien llegue nuevo (persona o agente). Foto del repo al 1 de octubre de 2026. Si algo contradice a `src/data/`, manda `src/data/`. Las reglas de `CLAUDE.md` (y su copia `AGENTS.md`) siempre aplican.

## 1. Qué es

Web oficial del evento **Study Abroad Fest**, organizado por **LEAD UTP · Pilar de Excelencia Académica**, en alianza con **UTP Internacional**.

| Dato | Valor |
|---|---|
| Fecha y hora | Sábado 10 de octubre de 2026, 2:00 a 6:00 p.m. (Lima, UTC-5) |
| Lugar | Centro de convenciones UTP, Jr. Hernán Velarde 260, Lima |
| Ingreso | Gratuito con inscripción previa en Luma (`https://luma.com/txyuybq9?tk=pwCvrY`) |
| Público | Estudiantes UTP, principalmente desde 5.º ciclo |
| Principio | Convertir el interés por estudiar fuera en un camino concreto hacia una oportunidad real |

La web tiene tres trabajos:

1. Mostrar **todo sobre el evento** en una sola página (`/`), con el cronograma como pieza central.
2. Entregar el **Calendario de becas** (convocatorias, fechas, tips, PDF y .ics) **solo a asistentes presenciales**, mediante un pasaporte de sellos y un código de canje.
3. Llevar a la inscripción en Luma.

Hitos: 1 oct landing pública · 6 oct prueba de canje con códigos reales · 7 oct impresión de pasaportes y stickers · 8 oct contenido congelado · 10 oct evento (canje activo desde las 2:00 p.m.).

## 2. Stack

- **Astro 7** con adaptador **@astrojs/vercel** (salida estática, salvo rutas de servidor).
- **Tailwind CSS v4** (tokens en `@theme`, `src/styles/global.css`) y **TypeScript estricto**.
- **Zod 4** para validar todo el contenido de `src/data/`. Si un dato no cumple el esquema, el build falla.
- **@fontsource**: Lilita One (display), Figtree (texto), IBM Plex Mono (etiquetas y horas). Inter y Archivo solo en navbar y footer.
- **Upstash Redis** (`@upstash/redis`) para contadores del canje. **ics** para el .ics. **qrcode** para QR. **sharp** para imágenes. **Playwright** (dev) para generar el PDF. **Vitest** para pruebas. **@vercel/analytics**.
- Sin CMS, sin cuentas de usuario, sin frameworks de UI. Animaciones solo con CSS y SVG (`animateMotion`), más un script mínimo con `IntersectionObserver` (`src/lib/motion.ts`).
- Node >= 22.12. Deploy en Vercel (proyecto propio, `vercel.json` usa `npm run build`).

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `astro build` y luego `scripts/bloquear-imprimir-en-vercel.mjs` |
| `npm run check` | `astro check` (obligatorio antes de cerrar una fase) |
| `npm test` | Vitest (`src/server/canje.test.ts`) |
| `npm run pdf` | Genera `private/calendario-becas-saf2026.pdf` imprimiendo `/calendario/imprimir` con Playwright (usa `astro dev` en el puerto 4322, solo local) |
| `npm run codigos -- --cantidad N --base-url URL` | Genera códigos de canje (ver sección 5) |
| `npm run og-image` | Genera la imagen Open Graph 1200×630 |

### Variables de entorno (`.env.example`)

| Variable | Uso |
|---|---|
| `CANJE_SECRET` | HMAC de los códigos y firma de la cookie de sesión. Obligatoria para el canje |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis. Sin ellas, el canje funciona sin límite de dispositivos ni de intentos y avisa en consola |
| `CANJE_FORZAR_ACTIVO` | `true` activa el canje antes del 10 oct para pruebas. Nunca funciona en Vercel (se ignora si existe `VERCEL`) |
| `SITE_URL` | Dominio final sin barra final. Lo usan `npm run codigos` y `astro.config.mjs` (`site`, canonical y OG). **El dominio sigue pendiente** |

`astro.config.mjs` llama `process.loadEnvFile()` para leer `.env` en local.

## 3. Estructura del repo

```
CLAUDE.md / AGENTS.md   Reglas del proyecto (mismo contenido)
PLAN.md                 Plan por fases, mecánica del pasaporte, pendientes
VIAJE.md                Especificación del rediseño "Viaje" (el que está en producción)
PROMPT-VIAJE.md         Prompts usados para implementar el rediseño
design/                 key-visual.png, referencia-landing.html, canvas/*.dc.html (diseño final)
private/                PDF del calendario y etiquetas.pdf (gitignored, solo servidor)
public/                 favicons, apple-touch-icon, og-image.png (nada protegido)
scripts/                pdf.ts, codigos.ts, og-image.ts, bloquear-imprimir-en-vercel.mjs
src/assets/             marca/, ponentes/, aliados/ (procesadas por astro:assets)
src/data/               Contenido tipado con Zod (fuente de verdad)
src/server/             canje.ts, redis.ts, alfabetoCodigo.ts, codigos.json, canje.test.ts
src/lib/                luma.ts, fechas.ts, viaje.ts, motion.ts, qr.ts, enlace.ts, canje-cliente.ts
src/components/         Ver sección 4
src/layouts/Base.astro  Layout con meta, OG, analytics
src/pages/              Rutas (sección 4)
```

### Rutas

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Estática | Landing "Viaje" |
| `/canje` | Estática | Formulario del código (`?c=SAF-XXXX-XXXX` lo prellena). Mobile primero |
| `/mi-calendario` | Servidor (`prerender = false`) | Calendario desbloqueado. Sin cookie válida redirige a `/canje` |
| `/calendario/imprimir` | Solo local | Página A4 que se imprime a PDF. noindex. Devuelve 404 en Vercel |
| `/evento.ics` | Pública | .ics del evento |
| `POST /api/canje` | Servidor | Valida el código y crea la cookie |
| `GET /api/descarga/pdf` | Servidor | PDF protegido por cookie |
| `GET /api/descarga/ics` | Servidor | .ics de cierres protegido por cookie |

## 4. Landing y componentes

`src/pages/index.astro` usa los componentes del concepto **Viaje** (un vuelo: Despegue → Ruta → Puertas → Pasaporte → Aterrizaje), en `src/components/viaje/`:

| Sección (ancla) | Componente | Datos |
|---|---|---|
| Navbar flotante estilo LEAD UTP | `SiteNav.astro` | `data/site.ts` |
| Hero "Despegue" | `viaje/Hero.astro`, `viaje/Countdown.astro`, `viaje/Plane.astro`, `viaje/Nube.astro` | `data/evento.ts` |
| `#cronograma` Ruta de vuelo | `viaje/Route.astro` | `data/schedule.ts` |
| `#ponentes` | `viaje/Speakers.astro` | `data/schedule.ts` |
| `#stands` Puertas de embarque | `viaje/Gates.astro` | `data/schedule.ts` y `data/stands.ts` |
| `#calendario` Pasaporte | `viaje/Passport.astro` | `data/schedule.ts`, `data/site.ts` |
| `#llegar` Pase de abordaje y FAQ | `viaje/Arrive.astro` | `data/schedule.ts`, `data/evento.ts` |
| CTA final (aterrizaje) | `viaje/Landing.astro` | |
| Footer | `SiteFooter.astro` | `data/site.ts` |
| Dock fijo de CTA en celular | `DockMovil.astro` | `data/evento.ts` |

Otros: `viaje/Estrellas.astro`, `viaje/PaperEdge.astro`, `viaje/Cta.astro`, `ui/Button`, `ui/Pin`, `ui/RoadDivider`, `ui/Sello`, y `canje/` (`FormCodigo`, `CalendarioDesbloqueado`, `TarjetaConvocatoria`, `CanjeNav`).

**Código heredado:** los componentes de primer nivel `Hero`, `Cronograma`, `Ponentes`, `Stands`, `Faq`, `PasaporteSeccion`, `PaseAbordaje`, `Footer`, `Nav`, `Countdown`, `CtaFinal`, `TagPonente` y los datos `cronograma.ts`, `ponentes.ts`, `faq.ts`, `aliados.ts` son del diseño anterior a "Viaje". La landing actual **no** los usa. Al tocar contenido, edita `schedule.ts` y `stands.ts`. Antes de borrar lo heredado, confirma que nada más lo importe.

## 5. Mecánica del pasaporte y canje

Recorrido del asistente:

1. Check-in: recibe un **pasaporte impreso** (A5 doblado).
2. Conversa con cada stand y recibe un **sello**.
3. Con todos los sellos, en la **mesa de canje** un voluntario le pega un **sticker con código único** `SAF-XXXX-XXXX` y su QR.
4. Escanea el QR (abre `/canje?c=CODIGO`) o escribe el código en `/canje`.
5. Ve su calendario con tips, descarga el PDF y agrega los cierres a su calendario.

Reglas implementadas (`src/server/canje.ts`):

| Regla | Valor |
|---|---|
| Código | 8 caracteres sin letras confusas (sin 0/O, 1/I/L). Se acepta con o sin guiones y con o sin prefijo SAF |
| Dispositivos por código | Hasta 3 (`MAX_DISPOSITIVOS`) |
| Sesión | Cookie `httpOnly` firmada con HMAC, 60 días (`saf_calendario`). Cookie de dispositivo: `saf_dispositivo` |
| Intentos fallidos | Máximo 10 por IP cada 10 minutos |
| Activación | Desde 2026-10-10 14:00 hora de Lima, calculada desde `data/evento.ts` (antes: "Disponible el día del evento") |

Cómo funciona por dentro:

- `scripts/codigos.ts` genera N códigos y escribe dos archivos: `codigos-imprimir.csv` (código y URL del QR, **gitignored**) y `src/server/codigos.json` (solo el **HMAC-SHA256** de cada código, sí se versiona). Si se pierde el CSV o se filtra, hay que regenerar todo y los códigos anteriores dejan de servir. Necesita dominio final (`--base-url` o `SITE_URL`). También produce `private/etiquetas.pdf` para stickers.
- `POST /api/canje` normaliza, calcula HMAC, verifica que exista, registra el dispositivo en Redis (`registrarActivacion`) y rechaza al pasar de 3. Errores devueltos: `formato`, `no-disponible`, `intentos`, `invalido`, `dispositivos`.
- `/mi-calendario` verifica la cookie con `verificarSesion` y muestra convocatorias y tips.
- El total de canjes en Redis (`totalCanjes`) es la métrica de asistentes que completaron el recorrido.
- Pruebas: `src/server/canje.test.ts` (normalización, HMAC, firma de cookie).
- PDF: 2 páginas A4 (`design/canvas/Calendario-P1/P2.dc.html`). Se sirve solo por `/api/descarga/pdf`. En Vercel el archivo no existe (está gitignored) y la ruta responde 404 hasta que se construya localmente con el PDF presente (`includeFiles` en `astro.config.mjs`).

## 6. Contenido actual en `src/data/`

Cada dato lleva `estado`: `confirmado` o `por-confirmar`. Solo lo confirmado se publica.

### Cronograma (`schedule.ts`, documento del equipo del 30 sep 2026)

| Hora | Bloque | Quién | Modalidad |
|---|---|---|---|
| 14:00 a 14:10 | Bienvenida | Shay Guzman y Carlos Gamonal, LEAD UTP | Presencial |
| 14:10 a 14:15 | Cápsula internacional | Fernando Injoque, Purdue University | Vlog + Zoom |
| 14:15 a 14:35 | Experiencia de intercambio en Purdue | Ivanna Yllahuaman | Presencial |
| 14:35 a 14:55 | Convenios, requisitos y movilidad internacional | UTP Internacional | Presencial |
| 14:55 a 15:25 | Berkeley Haas Global Access Program | Leslie Sánchez y Diego Mendoza, UC Berkeley | Presencial |
| 15:25 a 15:45 | Beca Fulbright | EducationUSA | Presencial |
| 15:45 a 16:05 | Panel de exbecarios | Marlon Ugaz (ELAP), Gresly Ruiz (Berkeley), Leslie Sánchez (Berkeley), Diego River (Harvard), Joshua Eduardo Valentino Galvez Peña (Tec de Monterrey) | Presencial |
| 16:05 a 16:10 | Cápsula: estudiar en Japón | Milagros Virhuez, Mila en Japón | Vlog + Zoom |
| 16:10 a 16:30 | Study in Japan | Giancarlo Carmelino | Zoom |
| 16:30 a 16:50 | Beca MEXT: experiencia de un exbecario | APEBEMO | Presencial |
| 16:50 a 17:00 | Intermedio y networking | | |
| 17:00 a 17:05 | Cápsula Erasmus+ | Guillermo Gonzalo | Vlog + Zoom |
| 17:05 a 17:30 | Erasmus Mundus | Erasmus Mundus Association Perú | Presencial |
| 17:30 a 17:45 | Experiencia Erasmus Mundus | Raquel Sánchez | Zoom |
| 17:45 a 17:55 | Migajeando Becas | Raúl Jáuregui | Presencial |
| 17:55 a 18:00 | Palabras de cierre | LEAD UTP | Presencial |

Seis grupos: Bienvenida y voces internacionales · Oportunidades internacionales y becas · Panel de exbecarios · Japón: Study in Japan y Beca MEXT · Europa: Erasmus+ y Erasmus Mundus · Migajeando Becas y cierre. Nota visible: los horarios y participantes pueden ajustarse a último momento.

### Stands (las 4 "puertas" que sellan el pasaporte, `stands.ts`)

1. UTP Internacional
2. EducationUSA
3. Study in Japan
4. Erasmus Mundus

**Ojo:** `CLAUDE.md`, `PLAN.md` y `PROMPT-VIAJE.md` aún mencionan a APEBEMO y Migajeando Becas como stands que sellan. Los datos vigentes en `stands.ts` son los cuatro de arriba. APEBEMO y Migajeando Becas siguen en el cronograma como bloques, no como stands. Erasmus+ aparece como aliado (`allies` en `schedule.ts`).

### Ponentes

14 confirmados y 1 por confirmar (Lizbeth Dávila, ELAP · SIAS, no está en el cronograma y no se publica). Cada ponente tiene `code` de país (US, MX, JP, EU, CN o null), `mode` (`vlog-zoom`, `zoom` o `experiencia`), hora de su primera actividad, y opcionalmente `imagen` (en `src/assets/ponentes/`) y `url` de perfil. Las fotos existen para Fernando Injoque, Ivanna, Leslie Sánchez, Diego Mendoza, Guillermo Gonzalo y Raúl Jáuregui.

### Convocatorias (`postulaciones.ts`) y tips (`tips.ts`)

Cuatro convocatorias: Movilidad UTP Internacional, Beca Fulbright, Erasmus+, Beca MEXT. **Todas están `por-confirmar`, con apertura, cierre y enlace oficial en `null`.** `tips.ts` solo tiene un ejemplo `por-confirmar`. Son contenido protegido: solo se importan desde código de servidor.

### Otros

- `evento.ts`: datos del evento. `contactoSoporte` es `null` (pendiente).
- `site.ts`: links de navegación, redes de LEAD UTP (Instagram, LinkedIn, Discord), columnas del footer y los 3 pasos del pasaporte (recoge tu pasaporte, junta los 4 sellos, canjea tu código).
- FAQ vigente: 5 preguntas en `schedule.ts` (incluye "¿Cómo consigo el Calendario de becas?").
- `schema.ts`: todos los esquemas Zod y tipos.

### Helpers

- `lumaUrl(source)` en `src/lib/luma.ts`: **todo CTA de inscripción debe usarlo.** Agrega `utm_source=site`, `utm_medium=cta`, `utm_campaign=<source>` y respeta el `tk`.
- `src/lib/fechas.ts` (es-PE, America/Lima) y `src/lib/viaje.ts` (formato de horas y fechas).

## 7. Identidad visual

Estilo **collage de papel recortado**: capas, bordes blancos gruesos, sombras suaves, leve rotación. Motivo central: caminos de papel que convergen. Una sola apariencia (sin modo oscuro). Respeta `prefers-reduced-motion`. Detalles de viaje: tarjetas de ponente como pase de abordaje, sellos con código de país (sin emojis de banderas).

| Token | Hex | Uso |
|---|---|---|
| `sky` | `#3B99D8` | Fondo principal |
| `sky-deep` | `#2F86C4` | Chips Zoom, acentos |
| `sky-soft` | `#CFE6F6` | Callouts |
| `magenta` | `#AC0BAD` | Inicio del degradado |
| `violet` | `#6258BB` | Fin del degradado, títulos, enlaces |
| `paper` / `paper-2` | `#FDFEFC` / `#F1F3FA` | Superficies y secciones alternas |
| `road` | `#525F97` | Caminos |
| `lav` | `#ABAEC8` | Bordes |
| `ink` / `ink-2` | `#1D2152` / `#4A507C` | Texto |
| `yellow` | `#FFE36B` | Solo hero, cuenta regresiva, sellos, sol final. No en el cronograma |
| `navy`, `footer`, `active` | `#020C3E`, `#050814`, `#D93340` | Navbar y footer estilo LEAD UTP |

Degradado de marca: `linear-gradient(100deg, magenta, violet)`. Mobile primero: probar a 360 y 390 px (el tráfico llega de Instagram y WhatsApp). El diseño de referencia vive en `design/canvas/*.dc.html` (HTML con estilos inline, con huecos de plantilla `{{x}}`, `<sc-for>`, `<sc-if>` que no son HTML real). Para "Viaje": `Viaje-Desktop.dc.html` (1440 px) y `Viaje-Mobile.dc.html` (390 px).

## 8. Reglas de contenido (resumen obligatorio)

1. No inventar datos. Si falta, "Por anunciar" o no se muestra.
2. Solo se publica lo `confirmado`.
3. No mostrar aforo ni cifras de capacidad.
4. La Embajada de Japón no aparece como stand ni organizador. MEXT se presenta vía APEBEMO.
5. Panel de exbecarios: solo experiencia personal. Las dudas oficiales (requisitos, procesos, convocatorias) se redirigen a los stands.
6. Ponencias internacionales: vlog pregrabado + preguntas en vivo por Zoom. Nunca "presenciales".
7. Nunca usar guion largo ni medio como separador en la copy. Usar punto, coma, dos puntos o "·". En rangos de hora, "a" o "→".
8. Tono joven, internacional, aspiracional, profesional y accesible. Español de Perú, tuteo.
9. El brochure de pitch no es fuente de verdad.
10. **Contenido protegido:** fechas de convocatorias, enlaces oficiales, tips, PDF y .ics de cierres jamás van en `public/`, en páginas prerenderizadas ni en JavaScript del cliente. Solo desde rutas de servidor que validan la cookie. Los códigos en texto plano nunca se suben al repo.

Convenciones: contenido solo en `src/data/*.ts` (los componentes no hardcodean datos), commits pequeños en español (`feat:`, `fix:`, `content:`), y antes de cerrar una fase `npm run build` sin errores y `npm run check`.

## 9. Animaciones

Solo CSS y SVG, curva base `cubic-bezier(.2, .8, .2, 1)`, todas apagadas con `prefers-reduced-motion`. Las secciones deben verse completas sin animación (una parada nunca queda en `opacity: 0` esperando el scroll). Catálogo: nubes a la deriva (`v-drift`), key visual flotando (`v-float`), sello postal (`v-spin`), líneas del camino (`v-dash`), avión por `animateMotion`, estrellas (`v-twinkle`), sol (`v-sun`), entrada de píldoras y tarjetas (`v-flip`, `v-pop`), sellos cayendo sobre el pasaporte (`v-stamp`), hovers de botones, puertas y tarjetas. Las animaciones de entrada se activan con `IntersectionObserver` una sola vez.

## 10. Estado y pendientes

Hecho: landing "Viaje" completa, datos validados con Zod, sistema de canje (código, cookie, Redis, PDF, .ics), página de impresión del PDF, OG image y favicons, analítica. Últimos commits: favicon de la maleta, ajustes de navbar y footer, cielo de atardecer en el aterrizaje, estrellas y nubes de papel en el cronograma.

Pendientes que bloquean contenido (según `PLAN.md` sección 8, revisa cuáles siguen abiertos):

- Fechas y enlace oficial de cada convocatoria, y 3 tips por convocatoria (UTP Internacional, EducationUSA y demás entes). Hoy todo está `por-confirmar`.
- Dominio o subdominio final (afecta `SITE_URL`, canonical, OG y los QR de los stickers; **debe definirse antes de generar los códigos**).
- Contacto para códigos perdidos después del evento (`contactoSoporte`).
- Cantidad de pasaportes y códigos, sellos físicos por stand, ubicación y voluntarios de la mesa de canje.
- URLs reales de "Contacto" y del Pilar de Excelencia Académica en el footer (hoy sin enlace).
- Reconfirmar si Lizbeth Dávila y Carmen (Tec de Monterrey) siguen participando (hoy `por-confirmar`, no se publican).
- Fotos autorizadas del resto de ponentes y logos de aliados faltantes (Erasmus+ no tiene logo).
- Actualizar `CLAUDE.md`, `AGENTS.md` y `PLAN.md` para reflejar los 4 stands vigentes.
- Generar y subir el PDF protegido si se quiere que `/api/descarga/pdf` funcione en producción (el archivo está gitignored).

## 11. Cómo trabajar aquí

1. Lee `CLAUDE.md` y `PLAN.md` (y `VIAJE.md` si tocas la landing).
2. Cambios de contenido: solo `src/data/`. No toques componentes.
3. Cambios de convocatorias o tips: corre `npm run pdf` al final y vuelve a construir.
4. Verifica: `npm run check`, `npm test`, `npm run build`. Busca `—` y `–` en `src/` (debe dar 0 resultados).
5. Nunca subas `.env`, `private/` ni `codigos-imprimir.csv`.
