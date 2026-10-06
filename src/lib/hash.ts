// SHA-256 con crypto.subtle (navegador y Node 22). Solo para claves de sellos y
// para derivar el número del pasaporte: nada de esto es secreto por sí solo.

const texto = new TextEncoder();

export async function sha256(entrada: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", texto.encode(entrada)));
}

export async function sha256Hex(entrada: string): Promise<string> {
  return Array.from(await sha256(entrada), (x) => x.toString(16).padStart(2, "0")).join("");
}
