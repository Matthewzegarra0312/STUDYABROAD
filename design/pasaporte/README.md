# Diseño del Pasaporte Digital y rediseño de /pase

Referencia visual SOLA. No es código para copiar: se implementa en Astro con los componentes y tokens del repo.
Fuente viva: https://claude.ai/artifact/X4NmTfXcNDnftc6PurpQmr

## Cómo leerlo
Cada `.dc.html` es un tablero. `canvas.json` indica el orden y las 4 páginas: movil, pase, sistema, desktop.
Los componentes (`Sello`, `Ruta`, `Libro`, `NavMovil`) se importan con `<dc-import>`.

## Assets `/_blob/<id>` y su archivo real en el repo
| id | archivo |
|---|---|
| 0492b58d1df7f8e8ced5f7afb5072e3e | src/assets/marca/hero-cielo-mobile.jpg |
| bac4bd132300e949771f60573858d60d | src/assets/marca/hero-cielo-desktop.jpg |
| 79ecc494887d7c55008bd6a00b0f31d4 | src/assets/aliados/fondo-stand-utp-internacional.png |
| 0630f8440bf9f8452c0755e719da3e5f | src/assets/aliados/fondo-stand-education-usa.png |
| 14560b597af3505c38686646b21d56bd | src/assets/aliados/fondo-stand-study-in-japan.png |
| 7d19a52576324244098514b5229bbdeb | src/assets/aliados/fondo-stand-erasmus-mundus.png |
| 4f5fc0f183f48a40ed2d9272310af51e | src/assets/marca/logo study.png |
| e2638c35f7d4444e7d0027c655afc8e1 | logo LEAD (ver src/assets/marca) |
| f2e478419a26ad839b74a0ecdc3def8b | public/pase-assets/fondo.jpg |
| 96bde69bedb808e88f4b763d2761b9a9 | public/pase-assets/avion.png |
