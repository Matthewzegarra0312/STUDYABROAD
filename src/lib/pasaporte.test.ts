import { describe, expect, it } from "vitest";
import {
  aplicarSello, CLAVE_PASAPORTE, claveValida, crearAlmacen, derivarNumero, estadoPasaporte, guardar, guardarPendiente,
  hashClave, leer, leerPendiente, marcarCanjeado, nuevoPasaporte, type Almacen,
} from "./pasaporte";

const IDS = ["a", "b", "c", "d"];
const falso = (): Almacen & { datos: Map<string, string> } => {
  const datos = new Map<string, string>();
  return { datos, getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => void datos.set(k, v), removeItem: (k) => void datos.delete(k) };
};
const quePeta: Almacen = {
  getItem: () => { throw new Error("bloqueado"); },
  setItem: () => { throw new Error("bloqueado"); },
  removeItem: () => { throw new Error("bloqueado"); },
};

describe("sellos", () => {
  it("sello nuevo y repetido: idempotente, no cambia la fecha", () => {
    const p0 = nuevoPasaporte("Ana", "P-ABCDE");
    const a = aplicarSello(p0, "a", new Date("2026-10-10T19:00:00Z"));
    expect(a.resultado).toBe("nuevo");
    expect(p0.sellos).toEqual({});
    const b = aplicarSello(a.pasaporte, "a", new Date("2026-10-10T20:00:00Z"));
    expect(b.resultado).toBe("repetido");
    expect(b.pasaporte.sellos.a).toBe("2026-10-10T19:00:00.000Z");
  });

  it("estados según la cantidad de sellos", () => {
    let p = nuevoPasaporte("Ana", "P-ABCDE");
    expect(estadoPasaporte(null, IDS)).toBe("sin-pasaporte");
    expect(estadoPasaporte(p, IDS)).toBe("vacio");
    p = aplicarSello(p, "a").pasaporte;
    expect(estadoPasaporte(p, IDS)).toBe("progreso");
    p = aplicarSello(p, "b").pasaporte;
    expect(estadoPasaporte(p, IDS)).toBe("progreso");
    p = aplicarSello(p, "c").pasaporte;
    expect(estadoPasaporte(p, IDS)).toBe("casi");
    p = aplicarSello(p, "zzz").pasaporte;
    expect(estadoPasaporte(p, IDS)).toBe("casi");
    p = aplicarSello(p, "d").pasaporte;
    expect(estadoPasaporte(p, IDS)).toBe("completo");
    expect(estadoPasaporte(marcarCanjeado(p), IDS)).toBe("canjeado");
  });
});

describe("almacenamiento", () => {
  it("guarda y lee", () => {
    const al = falso();
    const p = aplicarSello(nuevoPasaporte("Ana", "P-ABCDE"), "a").pasaporte;
    guardar(al, p);
    expect(leer(al)).toEqual(p);
  });

  it("JSON corrupto o v desconocida: null, sin lanzar", () => {
    const al = falso();
    al.datos.set(CLAVE_PASAPORTE, "{no es json");
    expect(leer(al)).toBeNull();
    al.datos.set(CLAVE_PASAPORTE, JSON.stringify({ v: 2, nombre: "Ana", numero: "P-1", sellos: {} }));
    expect(leer(al)).toBeNull();
    al.datos.set(CLAVE_PASAPORTE, JSON.stringify({ v: 1, nombre: "Ana" }));
    expect(leer(al)).toBeNull();
  });

  it("localStorage que lanza: sigue en memoria y avisa que no persiste", () => {
    const al = crearAlmacen(() => quePeta);
    const p = nuevoPasaporte("Ana", "P-ABCDE");
    guardar(al, p);
    expect(leer(al)).toEqual(p);
    expect(al.persistente).toBe(false);
    guardarPendiente(al, { id: "a", ts: "x" });
    expect(leerPendiente(al)).toEqual({ id: "a", ts: "x" });
  });

  it("acceso a localStorage que lanza al obtenerlo", () => {
    const al = crearAlmacen(() => {
      throw new Error("SecurityError");
    });
    expect(al.persistente).toBe(false);
    expect(al.getItem("x")).toBeNull();
  });
});

describe("número y claves", () => {
  it("número derivado estable, con forma P-XXXXX y distinto por código", async () => {
    const n = await derivarNumero("7K3QD-M9X2Q");
    expect(n).toMatch(/^P-[2-9A-HJKMNP-Z]{5}$/);
    expect(await derivarNumero("7K3QD-M9X2Q")).toBe(n);
    expect(await derivarNumero("7K3QD-M9X2R")).not.toBe(n);
  });

  it("hash de clave correcto y distinto por clave", async () => {
    expect(await hashClave("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await hashClave("A")).not.toBe(await hashClave("B"));
    const h = await hashClave("CLAVE-UNO");
    expect(await claveValida("CLAVE-UNO", h)).toBe(true);
    expect(await claveValida("CLAVE-DOS", h)).toBe(false);
    expect(await claveValida(null, h)).toBe(false);
    expect(await claveValida("CLAVE-UNO", undefined)).toBe(false);
  });
});
