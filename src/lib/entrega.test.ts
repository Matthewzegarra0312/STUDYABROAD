import { describe, expect, it } from "vitest";
import { enviarEntrega } from "./entrega";
import { aplicarSello, marcarCanjeado, nuevoPasaporte } from "./pasaporte";

const completo = () => {
  let p = nuevoPasaporte("Ana", "P-7K2QM");
  for (const id of ["a", "b"]) p = aplicarSello(p, id, new Date("2026-10-10T19:30:00Z")).pasaporte;
  return marcarCanjeado(p, new Date("2026-10-10T21:00:00Z"));
};
const resp = (status: number) => () => Promise.resolve(new Response("{}", { status }));

describe("enviarEntrega", () => {
  it("manda número, nombre, sellos y hora, más el PIN; nunca el código del pase", async () => {
    let enviado: Record<string, unknown> = {};
    const r = await enviarEntrega(completo(), "7305", (_u, init) => {
      enviado = JSON.parse(String(init.body));
      return Promise.resolve(new Response("{}", { status: 200 }));
    });
    expect(r).toBe("ok");
    expect(Object.keys(enviado).sort()).toEqual(["canjeadoEl", "nombre", "numero", "pin", "sellos"]);
  });

  it("traduce los estados: pin incorrecto, demasiados intentos, servidor caído y sin red", async () => {
    expect(await enviarEntrega(completo(), "1", resp(401))).toBe("pin");
    expect(await enviarEntrega(completo(), "1", resp(429))).toBe("intentos");
    expect(await enviarEntrega(completo(), "1", resp(503))).toBe("red");
    expect(await enviarEntrega(completo(), "1", () => Promise.reject(new Error("offline")))).toBe("red");
  });

  it("sin marca de canje no envía nada", async () => {
    expect(await enviarEntrega(nuevoPasaporte("Ana", "P-7K2QM"), "1", resp(200))).toBe("red");
  });
});
