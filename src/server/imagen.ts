// Lectura mínima de las medidas de un PNG o JPG a partir de sus bytes, sin
// decodificar la imagen. Sirve para validar lo que llega a /api/badge-upload
// sin confiar en el tipo que declara el cliente.

export interface Medidas {
  width: number;
  height: number;
}

const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** PNG: firma de 8 bytes y chunk IHDR con el ancho y el alto. */
export function medidasPng(bytes: Uint8Array): Medidas | null {
  if (bytes.length < 24) return null;
  if (!FIRMA_PNG.every((b, i) => bytes[i] === b)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(12) !== 0x49484452) return null; // "IHDR"
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** JPG: recorre los marcadores hasta el primer SOF (Start Of Frame). */
export function medidasJpeg(bytes: Uint8Array): Medidas | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return null;
    let marcador = bytes[i + 1] ?? 0;
    while (marcador === 0xff && i + 2 < bytes.length) {
      i++;
      marcador = bytes[i + 1] ?? 0;
    }
    // Marcadores sin largo (RSTn, TEM, SOI).
    if (marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd8)) {
      i += 2;
      continue;
    }
    // SOS o EOI: ya no hay cabecera de frame.
    if (marcador === 0xda || marcador === 0xd9) return null;
    const largo = view.getUint16(i + 2);
    const esSof = marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc;
    if (esSof) {
      if (i + 9 > bytes.length) return null;
      return { height: view.getUint16(i + 5), width: view.getUint16(i + 7) };
    }
    i += 2 + largo;
  }
  return null;
}
