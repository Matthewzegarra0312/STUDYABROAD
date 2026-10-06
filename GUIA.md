# Guía del Pasaporte Digital · Study Abroad Fest 2026

Para el equipo: quién hace qué el día del evento, qué ve el asistente, cómo funciona la mesa de canje y qué hacer si algo falla. Sábado 10 de octubre de 2026, 2:00 a 6:00 p.m., Centro de convenciones UTP.

---

## 1. En una página

1. El asistente abre su **pase de abordaje** con el código de su correo y toca **"Abrir mi pasaporte"**.
2. Recorre los **4 stands** (UTP Internacional, EducationUSA, Study in Japan, Erasmus Mundus) y **escanea el QR** de cada uno. Cada QR da un sello.
3. Con los **4 sellos**, el pasaporte pasa a "completado" y muestra una **franja amarilla en movimiento** con la hora.
4. Va a la **mesa de canje**. El voluntario revisa la pantalla, le **entrega un código SAF** de la lista impresa y marca **"Código entregado"** con el **PIN del equipo**.
5. El asistente usa ese código en `/canje` para ver su **Calendario de becas**.

El PIN es **solo del equipo**. El asistente nunca lo ve ni lo necesita.

---

## 2. Dónde vive cada cosa

| Qué | Dónde se guarda |
|---|---|
| Nombre, sellos y "Código entregado" del asistente | En **su celular** (navegador), no en un servidor |
| Registro de entregas de la mesa | En el servidor (Upstash Redis): N° de pasaporte, nombre, horas de sellos y hora de entrega |
| Claves de los QR de los stands | Solo en las URLs impresas. En el repo hay únicamente sus hashes |
| PIN de la mesa | Solo su hash (`src/data/mesa.json`). El PIN en claro no está en el repo |
| Código del pase de 10 caracteres | No se guarda en ningún lado |

Consecuencia importante: si el asistente **cambia de navegador, abre el pasaporte en incógnito o borra los datos**, pierde sus sellos. Por eso se le pide quedarse siempre en el mismo navegador.

---

## 3. Para el asistente

**Antes de llegar (con internet):**
1. Abrir `/pase`, escribir el código del correo y ver el pase. Se puede descargar como imagen.
2. Tocar **"Abrir mi pasaporte"** y escribir el mismo código. Aparece su portada con su nombre.
3. Usar siempre el **mismo navegador** del celular y **no usar incógnito**. Si el navegador no puede guardar datos, el pasaporte lo avisa.

**En el evento:**
- Botón **"Escanear sello"**: abre la cámara dentro del pasaporte. Apuntar al QR del stand.
- Alternativa: escanear el QR con la **cámara nativa del celular**. Se abre en el navegador; si es el mismo donde está el pasaporte, el sello se suma solo. Si todavía no abrió su pasaporte, la página se lo pide y estampa el sello al abrirlo.
- Un sello repetido dice **"Ya tienes este sello"** (no pasa nada).
- Funciona **sin conexión** una vez abierto el pasaporte con internet.

---

## 4. Para los voluntarios de los stands

- Cada stand tiene **su propio QR**, impreso desde la carpeta `qr-stands/` (un PNG y un SVG por stand, con el nombre y "Puerta N" debajo).
- Imprimir cada QR a **10 cm de lado como mínimo** y colocarlo **a la vista, sin brillos ni dobleces**. Debe escanear desde unos 40 cm, incluso con poca luz.
- Los QR **no son intercambiables**: el de EducationUSA solo sirve para el sello de EducationUSA.
- Un QR fotografiado se puede compartir. El control real es la mesa de canje.

---

## 5. Para la mesa de canje

**Qué se revisa:** el pasaporte del asistente debe mostrar **"Pasaporte completado"**, **4 / 4**, la **franja amarilla moviéndose** y la **hora cambiando**. Una captura de pantalla no sirve.

**Paso a paso:**
1. Verificar la pantalla del asistente.
2. Entregarle un **código SAF** de la lista impresa.
3. En su celular tocar **"Canjear mi código"**. Aparece la vista de mesa con su nombre y su **N° de pasaporte** (`P-XXXXX`).
4. Anotar la fila en el Excel de la mesa (hora, nombre, N° de pasaporte, código entregado, voluntario).
5. Escribir el **PIN del equipo** y tocar **"Marcar código entregado"**.
6. El pasaporte cambia a **"Código entregado"** y el asistente puede tocar **"Ir a canjear mi código"**.

**Reglas del PIN:**
- 4 dígitos. Se comparte solo con los voluntarios de la mesa, de viva voz o por un canal privado.
- **5 PIN incorrectos seguidos** bloquean el teclado **60 segundos** (también si se recarga la página).
- Si sospechas que el PIN se filtró, hay que cambiarlo (ver sección 7).

**Si no hay señal al marcar:** el pasaporte queda como "canjeado" en el celular, pero aparece **"Sin conexión: la entrega aún no quedó registrada"** y un botón **"Registrar entrega"**. Cuando haya señal, tocar ese botón, escribir el PIN y listo. El botón desaparece cuando el registro llega al servidor.

**El Excel de la mesa** (`mesa-canje-saf2026.xlsx`): una fila por asistente. La columna Estado marca en rojo los duplicados (mismo pasaporte o mismo código dos veces) y en amarillo los datos faltantes. Si varios voluntarios registran a la vez, subirlo a **Google Sheets** y trabajar en el mismo documento.

---

## 6. Para quien administra (comandos)

Requisitos: Node 22.12 o superior y `npm ci` hecho.

| Comando | Qué hace | Cuándo |
|---|---|---|
| `npm run pin-mesa -- XXXX` | Cambia el PIN de la mesa (4 dígitos). Después hay que **hacer commit de `src/data/mesa.json` y volver a desplegar** | Antes del evento, o si el PIN se filtra |
| `npm run entregas` | Exporta las entregas guardadas en el servidor a `entregas.csv` (ábrelo con Excel) | Durante o después del evento |
| `npm run entregas -- --borrar` | Exporta y **borra** las entregas del servidor | Al terminar el evento (tiene nombres de asistentes) |
| `npm run qr-stands` | Genera claves y QR de los stands | **No volver a correrlo** (ver abajo) |
| `npm run codigos` | Genera los códigos SAF imprimibles | Solo si hace falta una tanda nueva |
| `npm test`, `npm run check`, `npm run build` | Pruebas, tipos y compilación | Antes de cada despliegue |

`npm run entregas` necesita `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en un archivo `.env` o en el entorno. Son las mismas variables que ya usa `/canje` en Vercel.

**Sobre los QR de los stands:**
- Los imprimibles y sus claves están en `qr-stands/` (en la computadora de quien los generó, **ignorada por git**, nunca se sube).
- `src/data/sellos.json` guarda solo los hashes. Si se vuelve a correr `npm run qr-stands` se generan claves nuevas y **todos los QR ya impresos dejan de funcionar** (el script pide `--force` para avisar de eso).

---

## 7. Si algo falla

| Problema | Qué hacer |
|---|---|
| El QR dice **"No encontramos este destino"** | El QR no es de un stand de este evento, está dañado o es de otra tanda. Revisar que sea el QR impreso original. Si se regeneraron claves, hay que reimprimir |
| El sello **no se suma** | Probar con el botón "Escanear sello" dentro del pasaporte. Revisar que use el mismo navegador donde abrió su pasaporte y que no esté en incógnito |
| Aparece **"Primero abre tu pasaporte"** | Escaneó con otro navegador o no lo había abierto. Escribe su código del pase ahí mismo: el sello se estampa solo al abrir |
| **"Tu navegador no puede guardar tus sellos"** | Está en incógnito o con el almacenamiento bloqueado. Salir del incógnito |
| **Perdió sus sellos** (cambió de navegador, borró datos) | Los sellos viven en el celular, no se pueden recuperar. Abrir de nuevo el pasaporte con su código y volver a escanear, o decidir en la mesa según el caso |
| **El código del pase no abre nada** | Revisar el formato `XXXXX-XXXXX` (sin importar mayúsculas ni guiones). Es el código del correo, no el de Luma |
| **PIN bloqueado** | Esperar los 60 segundos. Si el voluntario se equivocó, escribir con calma |
| **Se filtró el PIN** | `npm run pin-mesa -- XXXX` con uno nuevo, commit de `src/data/mesa.json` y volver a desplegar. Los pasaportes ya marcados como "Código entregado" no se pierden |
| **El registro no llega al servidor** (siempre "Sin conexión" aunque haya señal) | Revisar que las variables de Upstash estén definidas en Vercel. Sin ellas el servidor responde 503 |
| **Un asistente reclama un segundo código** | Buscarlo en el Excel y en `npm run entregas` por su N° de pasaporte: si ya figura, ya se le entregó |

---

## 8. Despliegue (resumen para quien publica)

1. `git fetch origin` y confirmar que la rama no va por detrás de `origin/main`.
2. `npm ci`, `npm run check`, `npm test`, `npm run build`. El build debe terminar con la línea "reglas nuevas" de `rutas-pase`.
3. Confirmar que `src/data/mesa.json` tiene el **PIN real** (no el provisional) y que `src/data/sellos.json` es el que corresponde a los QR impresos.
4. Confirmar en Vercel las variables `CANJE_SECRET` y las de Upstash.
5. Desplegar primero a preview y probar con un celular real, **sobre todo en iPhone**: abrir pasaporte, escanear los 4 QR, mesa con PIN, "Código entregado" y que la entrega aparezca en `npm run entregas`.
6. Pasar a producción y repetir.

Si algo sale mal con el modo sin conexión, el service worker (`public/sw.js`) se puede reemplazar por uno que se desregistre. Si cambias una imagen de `public/pase-assets/`, sube la constante `VERSION` de `public/sw.js` para que los celulares la vean.

---

## 9. Privacidad

- Hay **nombres de asistentes** en dos lugares: el celular de cada uno y el registro de entregas del servidor.
- No se guarda el código de 10 caracteres del pase, ni el correo, ni el QR de Luma.
- No hay cookies nuevas ni analítica en `/pasaporte`, `/stamp/*` ni `/pase`.
- Después del evento: `npm run entregas -- --borrar` y eliminar el Excel de la mesa.
- No compartir el PIN, las claves de los QR (`qr-stands/claves.txt`) ni los códigos SAF en claro fuera del equipo.
