// Franja de lectura del pasaporte (las dos líneas tipo "P<SAF2026<<..."). Es
// solo decoración: no codifica nada que no esté ya visible en la página.

const LARGO = 44;

const limpiar = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "<").replace(/^<+|<+$/g, "");

const rellenar = (s: string): string => s.slice(0, LARGO).padEnd(LARGO, "<");

export function lineasMrz(nombre: string, numero: string, sellos: number, total: number): [string, string] {
  const l1 = rellenar(`P<SAF2026<<${limpiar(nombre)}`);
  const l2 = rellenar(`${limpiar(numero)}<<${sellos}<${total}<SELLOS<<101026`);
  return [l1, l2];
}
