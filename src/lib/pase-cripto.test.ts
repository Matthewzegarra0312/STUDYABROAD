// Vector generado por saf-pases (src/web-pases.ts) con datos ficticios y 1000
// iteraciones: confirma que Node (saf-pases) y crypto.subtle (web) coinciden.
import { describe, expect, it } from "vitest";
import { abrirPase, derivar, normalizarCodigo } from "./pase-cripto";
import { codigoDeUrl } from "./pase-cliente";
import vector from "./pase-vector.test.json";

const respuesta = (cuerpo: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(cuerpo) } as Response);

describe("pase cifrado", () => {
  it("deriva el mismo id que saf-pases", async () => {
    const { id } = await derivar(vector.codigo, vector.iteraciones);
    expect(id).toBe(vector.id);
  });

  it("abre el pase con el código correcto", async () => {
    let pedido = "";
    const c = await abrirPase(vector.codigo, {
      iteraciones: vector.iteraciones,
      pedir: (url) => ((pedido = url), respuesta(vector.archivo)),
    });
    expect(pedido).toBe(`/pases/${vector.id}.json`);
    expect(c?.n).toBe("Pasajera de Prueba");
    expect(c?.q).toBe("https://luma.com/check-in/ejemplo?pk=prueba");
  });

  it("código incorrecto o archivo ajeno: null, sin distinguir el motivo", async () => {
    expect(await abrirPase("7K3QD-M9X2Q", { iteraciones: vector.iteraciones, pedir: () => respuesta({}, false) })).toBeNull();
    expect(await abrirPase("7K3QD-M9X2Q", { iteraciones: vector.iteraciones, pedir: () => respuesta(vector.archivo) })).toBeNull();
  });

  it("normaliza lo que escribe una persona", () => {
    expect(normalizarCodigo(" 7k3qd m9x2p ")).toBe("7K3QD-M9X2P");
    expect(normalizarCodigo("7K3QD-M9X2")).toBeNull();
    expect(normalizarCodigo("OIL00-00000")).toBe("01100-00000");
  });

  it("lee el código de la ruta, #c= y ?c=", () => {
    expect(codigoDeUrl(new URL("https://x.org/pase/7K3QD-M9X2P"))).toBe("7K3QD-M9X2P");
    expect(codigoDeUrl(new URL("https://x.org/pase#c=7K3QD-M9X2P"))).toBe("7K3QD-M9X2P");
    expect(codigoDeUrl(new URL("https://x.org/pase?c=7K3QD-M9X2P"))).toBe("7K3QD-M9X2P");
    expect(codigoDeUrl(new URL("https://x.org/pase"))).toBeNull();
  });
});
