# PROMPT-PASAPORTE.md · Pasaporte Digital SAF 2026 + rediseño de /pase

Plan de implementación y prompt para Claude Code. Evento: sábado 10 de octubre de 2026. Quedan pocos días, así que el alcance es deliberadamente pequeño: Astro + datos estáticos + `localStorage` + QR. Sin base de datos, sin backend nuevo, sin autenticación.

---

## 0. Antes de escribir código

Lee, en este orden:

1. `CLAUDE.md` (reglas de contenido y de identidad visual). Se aplican todas. Las que más importan acá: no inventar datos, no mostrar aforo, nunca usar guion largo ni guion medio en la copy (usa punto, coma, dos puntos o "·"), español de Perú con tuteo, sin emojis de banderas, `prefers-reduced-motion` respetado, mobile primero a 360 y 390 px.
2. `src/data/schedule.ts` (`gates`), `src/data/stands.ts`, `src/data/site.ts`.
3. `src/lib/pase-cripto.ts`, `src/lib/pase-cliente.ts`, `src/pages/pase.astro`, `src/components/pase/pase.html`. El pase personal ya existe y **no se rompe**.
4. `src/components/viaje/Passport.astro`, `src/components/ui/Sello.astro`, `src/styles/global.css`, `src/components/canje/CanjeNav.astro`.
5. La carpeta `design/pasaporte/` (ver sección 2). Es la referencia visual exacta.

Trabaja en `main`, con commits pequeños en español (`feat: …`, `fix: …`, `content: …`). **No hagas push.** Cierra cada tarea con `npm run build`, `npm run check` y las pruebas.

---

## 1. Decisiones ya tomadas por Carlos (no reabrir)

- El pasaporte digital **reemplaza** al pasaporte impreso.
- Los **4 stands** son los de `gates`: UTP Internacional, EducationUSA, Study in Japan, Erasmus Mundus. No agregar ni quitar ninguno.
- La experiencia vive en este mismo repo y dominio (`studyabroad.leadutp.org`), en la ruta `/pasaporte`. La home solo lleva un CTA "Mi pasaporte".
- El **código SAF** (el del calendario) lo sigue entregando **una persona en la mesa de canje** después de ver el pasaporte 4/4. La lógica de `/canje` y `/mi-calendario` **no se toca**.
- Cada asistente se identifica con el **código de 10 caracteres** de su pase de abordaje (el de `/pase`). Los correos ya salieron; no se reenvía nada. El botón "Abrir mi pasaporte" se agrega en `/pase`, que es parte de la web.
- Solo entran asistentes confirmados. **No hay modo "invitado"**.
- La mesa de canje marca "Código entregado" con un **PIN corto del equipo**. Sin hoja ni lista aparte.
- Sin rankings, puntos, niveles ni XP. El único objetivo es visitar, sellar, completar.

---

## 2. Referencia visual

Antes de empezar, el diseño se copia a `design/pasaporte/` (ya viene con un `README.md` que mapea las imágenes del lienzo a los archivos reales del repo). Son HTML con estilos inline, igual que `design/canvas/`: úsalos como referencia visual exacta, **no como código para copiar tal cual**. Si algo del diseño choca con `CLAUDE.md`, gana `CLAUDE.md`.

| Archivo de diseño | Qué es | Dónde se implementa |
|---|---|---|
| `Sello.dc.html` | los 4 sellos (SVG) y su estado pendiente | `src/components/pasaporte/SelloStand.astro` |
| `Ruta.dc.html` | progreso 0 a 4 con avión | `RutaProgreso.astro` |
| `Libro.dc.html` | página del pasaporte con titular, número, 4 casillas y franja de lectura | `LibroPasaporte.astro` |
| `Codigo.dc.html` | abrir con el código | `/pasaporte`, estado "sin pasaporte" |
| `Main.dc.html` | portada del pasaporte | `/pasaporte`, estado "bienvenida" |
| `Vacio`, `Progreso`, `Casi`, `Completo` | pasaporte 0, 2, 3 y 4 de 4 | `/pasaporte`, estados por cantidad de sellos |
| `Escaner.dc.html` | cámara dentro del pasaporte | `Escaner.astro` |
| `Nuevo`, `Repetido`, `Invalido`, `Espera` | respuestas al leer un QR | `/stamp/[id]` |
| `Mesa.dc.html`, `Canjeado.dc.html` | validación del voluntario y estado final | `/pasaporte`, vista mesa |
| `Animacion.dc.html` | guion de la animación (1.1 s) | CSS en `global.css` |
| `Pase.dc.html`, `PaseForm.dc.html`, `DeskPase.dc.html` | rediseño de `/pase` | `src/pages/pase.astro` |
| `DeskPasaporte`, `DeskHome` | desktop | mismas páginas, `lg:` |

Tokens, tipografías y animaciones: las de `global.css` y `CLAUDE.md`. No agregues colores nuevos salvo el `#22709F` de Erasmus Mundus, que ya existe en `Passport.astro`.

---

## 3. Arquitectura

### 3.1 Rutas (todas prerenderizadas, sin servidor)

| Ruta | Qué hace |
|---|---|
| `/pasaporte` | Pasaporte. Un solo documento con estados que se muestran según lo guardado en el navegador. |
| `/stamp/[id]` | Una página estática por stand (`getStaticPaths` con los 4 `standId` de `gates`). Lee `?k=` y decide qué mostrar. |
| `/pase` | Rediseñada. Misma lógica de descifrado. Agrega el botón "Abrir mi pasaporte". |

Las tres: `noindex`, `analytics={false}` y `<meta name="referrer" content="no-referrer">`, igual que `/pase` hoy. Sin cookies nuevas.

### 3.2 Estado en el navegador

Una sola clave, `study_abroad_passport`, con JSON versionado:

```ts
interface Pasaporte {
  v: 1;
  nombre: string;            // ya ajustado, viene de abrirPase()
  numero: string;            // "P-XXXXX", derivado (ver 3.4)
  sellos: Record<string, string>; // standId -> ISO 8601 de cuando se selló
  canjeadoEl?: string;       // ISO, lo pone la mesa
}
```

Y una clave auxiliar `study_abroad_pending` con `{ id, ts }` para un sello leído antes de abrir el pasaporte.

Reglas:
- **No se guarda** el código de 10 caracteres, el correo, ni el QR de Luma. Solo nombre, número, sellos y marca de canje.
- Toda lectura y escritura va en `try/catch`. Si `localStorage` falla (modo privado, bloqueado), la página sigue funcionando en memoria y muestra un aviso corto: "Tu navegador no puede guardar tus sellos. Sal del modo incógnito."
- JSON corrupto o `v` desconocido: se ignora y se pide abrir el pasaporte de nuevo, sin romper la página.
- Aplicar un sello es **idempotente**: si ya existe, no cambia la fecha y devuelve "repetido".
- Las horas se muestran en hora de Lima (usa los helpers de `src/lib/fechas.ts`).

### 3.3 Sellos y QR

Cada QR físico lleva: `https://studyabroad.leadutp.org/stamp/<standId>?k=<clave>`.

- `<clave>`: 16 caracteres aleatorios (alfabeto Crockford, el mismo de `alfabetoCodigo.ts`), **una por stand**, generada una sola vez.
- El repo guarda solo el **hash SHA-256 en hex** de cada clave, en `src/data/sellos.json`. La página calcula `SHA-256(k)` con `crypto.subtle` y compara. Así, ver el código fuente no revela las URLs de los QR.
- `scripts/qr-stands.ts`: genera las claves, escribe `src/data/sellos.json` (solo hashes) y deja en `qr-stands/` (en `.gitignore`, **nunca se commitea**) un PNG de 1200 px y un SVG por stand, con el nombre del stand y "Puerta N" debajo del QR, listos para imprimir. También `qr-stands/claves.txt` con las 4 URLs completas. Si el script se vuelve a correr, advierte que invalida los QR ya impresos y pide `--force`.
- Agrega `qr-stands/` a `.gitignore`.

Limitación asumida (documéntala en el código): un QR fotografiado se puede compartir. El control real sigue siendo la mesa de canje.

### 3.4 Identidad: de `/pase` a `/pasaporte`

- Reusa `abrirPase(codigo)` y `normalizarCodigo()` de `pase-cripto.ts` tal cual. Del contenido solo usa `n` (nombre). **No uses `q`.**
- `numero`: `"P-" + 5 caracteres Crockford` tomados de `SHA-256("pasaporte:" + códigoNormalizado)`. No uses caracteres del propio código.
- Entrada desde `/pase`: el botón "Abrir mi pasaporte" navega a `/pasaporte#c=<código>`. `/pasaporte` lee el fragmento, lo borra con `history.replaceState` (igual que `/pase`) y valida. El código nunca se guarda.
- Entrada directa a `/pasaporte` sin pasaporte guardado: muestra el estado "Abre tu pasaporte" con el campo del código.
- Si `abrirPase` falla: mismo mensaje de error amable que `/pase`.
- Si el navegador ya tiene un pasaporte de **otra persona**, al abrir con un código distinto pide confirmación antes de reemplazar ("Este celular ya tiene el pasaporte de otra persona. ¿Reemplazarlo?").

### 3.5 Lectura de QR

- Botón "Escanear sello" dentro de `/pasaporte` (clave contra la separación de navegadores: lo escaneado queda en el mismo navegador).
- Usa `BarcodeDetector` si existe. Si no, `jsqr` (única dependencia nueva, pura JS). Cámara trasera (`facingMode: "environment"`).
- Al leer: acepta **solo** URLs del mismo origen con ruta `/stamp/<id>` y `k` válida. Cualquier otra cosa muestra "No encontramos este destino" sin navegar.
- Libera la cámara siempre: al cerrar, al leer, al ocultar la pestaña y al salir de la página.
- Permiso de cámara denegado o sin cámara: mensaje claro y la alternativa "Escanea el QR con la cámara de tu celular. Se abrirá en este mismo pasaporte."
- Respeta `prefers-reduced-motion` en la línea de barrido.

### 3.6 Respuestas de `/stamp/[id]` (ver diseño)

| Caso | Resultado |
|---|---|
| `k` válida, sello nuevo | Estampa, guarda, muestra "Nuevo destino desbloqueado" con N / 4 y botón "Ver mi pasaporte". Animación de 1.1 s. |
| `k` válida, ya lo tenía | "Ya tienes este sello". Positivo, sin error. |
| `k` ausente, incorrecta o `id` desconocido | "No encontramos este destino". No guarda nada. |
| `k` válida pero no hay pasaporte en este navegador | Guarda un pendiente y muestra "Primero abre tu pasaporte" con el campo del código. Al abrirlo, el pendiente se estampa solo. |
| Cuarto sello | Lleva directo a la vista de pasaporte completo. |

### 3.7 Pasaporte completo y mesa de canje

- 4/4: pantalla "Pasaporte completado", sello "APROBADO", y una **franja amarilla en movimiento con hora con segundos** (verificación en vivo), para que una captura de pantalla no pase por válida. Texto: "Muestra esta pantalla en la mesa de canje."
- Botón "Canjear mi código": abre la vista de mesa.
- Vista de mesa (PIN del equipo): muestra titular, número, los 4 sellos, hora y franja. El voluntario entrega el código SAF, ingresa el PIN y toca "Marcar código entregado". Se guarda `canjeadoEl` y el pasaporte pasa al estado "Código entregado" (sello CANJEADO, botón "Ir a canjear mi código" que apunta a `/canje`).
- PIN: 4 dígitos. Se guarda **solo su hash PBKDF2** (misma técnica que `pase-cripto.ts`, con sal propia) en `src/data/mesa.json`, generado con `scripts/pin-mesa.ts`. Limitación asumida: 4 dígitos se pueden forzar sin conexión. Es aceptable porque solo protege una marca visual, no el calendario.
- Máximo 5 PIN fallidos seguidos: bloqueo de 60 s en pantalla.

### 3.8 Sin conexión

Señal incierta en el sótano. Un `public/sw.js` mínimo, registrado solo en `/pasaporte` y `/stamp/*`:
- Precachea `/pasaporte`, las 4 páginas `/stamp/<id>`, JS, CSS, fuentes y los assets que usan.
- Estrategia: caché primero con actualización en segundo plano.
- Versión del caché en una constante para invalidar.
- **No cachees** `/api/*`, `/mi-calendario` ni `/pase`.

Es la última fase. Si el tiempo aprieta, es lo primero que se recorta, pero avisa.

---

## 4. Tareas, en orden

Cada tarea termina con build, check y pruebas pasando, y un commit.

**T1 · Datos y utilidades puras.**
`src/data/sellos.ts` (Zod, lee `sellos.json`, valida que cada `standId` exista en `gates`), `src/lib/pasaporte.ts` (tipos, `leer`, `guardar`, `aplicarSello`, `estadoPasaporte`, `derivarNumero`, migración, memoria de respaldo), `src/lib/hash.ts` si hace falta. Sin Astro, sin DOM salvo `localStorage` inyectable para probar.
Pruebas Vitest: sello nuevo y repetido, idempotencia, JSON corrupto, `v` desconocida, `localStorage` que lanza, número derivado estable, hash de clave correcto y distinto por stand.

**T2 · Scripts.**
`scripts/qr-stands.ts` y `scripts/pin-mesa.ts` como en 3.3 y 3.7. `.gitignore` actualizado. Corre `qr-stands` una vez para dejar `sellos.json`, y **no commitees** nada de `qr-stands/`.

**T3 · Componentes de presentación.**
`SelloStand.astro` (los 4 SVG del diseño, props `stand`, `estado`, `size`, `rot`, filtro de tinta con ids únicos por instancia para evitar choques), `RutaProgreso.astro`, `LibroPasaporte.astro`. Sin lógica de estado: reciben datos por props.

**T4 · Página `/pasaporte`.**
Todos los estados del diseño (sin pasaporte, bienvenida, 0, 2, 3, 4, canjeado) con una función que decide el estado desde lo guardado. Navbar con `CanjeNav` (agrega `current="pasaporte"` y la etiqueta "Pasaporte · SAF 2026"). Mobile primero, luego `lg:` según `DeskPasaporte`. En desktop, el CTA "Enviar enlace a mi celular" puede ser un texto con la URL por ahora: no inventes un servicio de envío.

**T5 · Página `/stamp/[id]` y animación.**
`getStaticPaths` desde `gates`. Los 5 casos de 3.6. Animación en `global.css` siguiendo `Animacion.dc.html` (0.00 a 1.10 s, solo CSS, apagada con `prefers-reduced-motion`: el sello aparece ya estampado).

**T6 · Escáner.**
Como en 3.5. Prueba en un celular real, no solo en el navegador de escritorio.

**T7 · Entrada desde `/pase` y rediseño.**
Objetivo de Carlos: el pase ya existe y funciona, solo hay que **mejorar su diseño para que coincida con el look actual del sitio**. Eso incluye la **tarjeta del pase** (`src/components/pase/pase.html`), porque el PNG que cada persona descarga con "Descargar pase" sale de esa tarjeta. Rediseña la página `pase.astro` y la tarjeta según `Pase.dc.html`, `PaseForm.dc.html` y `DeskPase.dc.html`. Agrega el botón "Abrir mi pasaporte" con el fragmento.
- **Sí se toca** `pase.html` (tarjeta) y los estilos de la página. El PNG descargado debe salir con el diseño nuevo.
- **No se toca** la lógica: `pase-cripto.ts`, `pase-cliente.ts`, el formato de `public/pases/*.json`, los datos mostrados (nombre, fecha, horario, lugar, QR de Luma) ni los textos legales. Los correos ya enviados no se reenvían ni se regeneran.
- Ojo con la descarga: revisa `pase-descarga.ts`. Si la tarjeta nueva usa sombras, muescas, filtros o fuentes que la librería de captura (html-to-image o la que use) no renderiza bien, ajusta el diseño o la captura, pero el PNG **no puede salir en blanco ni con fuentes distintas**. Pruébalo en Chrome de escritorio, Android e iOS Safari, y comprueba que el QR del PNG sigue escaneando en Luma.
- Si hace falta cambiar `pase-descarga.ts` para lograrlo, hazlo con cambios mínimos y avisa.

**T8 · Mesa de canje.**
Vista de mesa, PIN con bloqueo, marca `canjeadoEl`, estado "Código entregado".

**T9 · Home, navegación y copy.**
- `src/data/site.ts`: `passportSteps` nuevos: "Abre tu pasaporte · Digital, con el código de tu pase.", "Junta los 4 sellos · Escanea el QR de cada puerta.", "Canjea tu código · En la mesa, y descarga tu calendario."
- `Passport.astro`: pasos, CTA principal "Mi pasaporte" (a `/pasaporte`) y secundario "Ya tengo mi código" (a `/canje`). Sigue `DeskHome.dc.html`.
- `navLinks` y `footerColumns`: agrega "Mi pasaporte". La etiqueta NUEVO: pásala de "Mi badge" a "Mi pasaporte" (confirma con Carlos antes de quitarla del badge).
- `schedule.ts`, FAQ "¿Cómo consigo el Calendario de becas?": actualizarla para que hable del pasaporte digital y de la mesa de canje, sin prometer nada que no exista.
- `Gates.astro`: el texto "Cada puerta te sella el pasaporte" sigue siendo cierto. No cambiarlo salvo que choque.

**T10 · Sin conexión.**
Como en 3.8.

**T11 · Cierre.**
`npm run build`, `npm run check`, todas las pruebas. Recorre el checklist de la sección 6 en un celular real y reporta resultados, no suposiciones.

---

## 5. Qué NO hacer

- No tocar `/canje`, `/mi-calendario`, `src/server/*`, `codigos.json` ni el formato de `public/pases/*.json`.
- No guardar el código de 10 caracteres, correos ni el QR de Luma en `localStorage`.
- No subir claves de QR, PIN ni nada de `qr-stands/` al repo.
- No agregar analítica a estas páginas.
- No mostrar ninguna cifra de aforo ni de asistentes.
- No inventar textos de stands. `Study in Japan` y `Erasmus Mundus` no tienen descripción en `stands.ts`: no la escribas.
- No usar emojis ni guion largo ni guion medio en la copy.
- No agregar puntos, niveles ni rankings.
- No hacer push, ni crear ramas, ni desplegar. VP despliega.

---

## 6. Checklist de prueba antes del evento (en celular real)

1. Abrir `/pase` con un código real, tocar "Abrir mi pasaporte", ver el nombre y el número.
2. Escanear los 4 QR con el botón "Escanear sello" y confirmar 1, 2, 3, 4 / 4.
3. Escanear dos veces el mismo QR: debe decir "Ya tienes este sello".
4. Escanear con la cámara nativa del celular (otro navegador): debe pedir abrir el pasaporte, no perder el sello.
5. Modo avión después de abrir el pasaporte: debe seguir escaneando y guardando.
6. Pestaña de incógnito: debe avisar que no puede guardar.
7. "Reducir movimiento" activado: sin giros, el sello aparece ya estampado.
8. Una URL `/stamp/educationusa` sin `k` o con `k` falsa: "No encontramos este destino".
9. Mesa: PIN correcto, PIN incorrecto 5 veces, estado "Código entregado".
10. `/pase` en 360, 390 y 1440 px: se ve bien. "Descargar pase" genera el PNG con el diseño nuevo (no en blanco, fuentes correctas) y su QR escanea en Luma. Probado en Android e iOS Safari.
11. Imprimir los 4 QR al tamaño real y escanearlos desde 40 cm, con poca luz.

---

## 7. Pendientes que debe confirmar Carlos

1. **PIN del equipo:** ¿quién lo define y cómo se lo pasa a los voluntarios de la mesa?
2. **Etiqueta NUEVO:** ¿pasa de "Mi badge" a "Mi pasaporte"?
3. **Desktop:** ¿el botón "Enviar enlace a mi celular" es solo un texto con la URL, o hay algo mejor?
4. **Impresión de QR:** ¿quién imprime y de qué tamaño? (mínimo recomendado: 10 cm de lado).
5. **Señal en el sótano:** si es mala, la fase de sin conexión pasa a ser obligatoria.
6. **Fecha límite:** si no alcanza todo, el orden de recorte es T10, luego el bloqueo del PIN. T1 a T9 son el mínimo.
