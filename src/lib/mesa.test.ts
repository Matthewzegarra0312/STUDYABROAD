import { describe, expect, it } from "vitest";
import { BLOQUEO_PIN_MS, crearDatosMesa, MAX_FALLOS_PIN, pinValido, registrarFallo, segundosDeBloqueo, sinBloqueo, verificarPin } from "./mesa";

describe("PIN de la mesa", () => {
  it("acepta el PIN correcto y rechaza otros", async () => {
    const mesa = await crearDatosMesa("4821", 1000);
    expect(await verificarPin("4821", mesa)).toBe(true);
    expect(await verificarPin("4822", mesa)).toBe(false);
    expect(await verificarPin("48211", mesa)).toBe(false);
  });

  it("solo 4 dígitos", () => {
    expect(pinValido("0123")).toBe(true);
    expect(pinValido("123")).toBe(false);
    expect(pinValido("12a4")).toBe(false);
  });

  it("bloquea 60 s tras 5 fallos seguidos", () => {
    let e = sinBloqueo();
    for (let i = 0; i < MAX_FALLOS_PIN - 1; i++) e = registrarFallo(e, 1000);
    expect(segundosDeBloqueo(e, 1000)).toBe(0);
    e = registrarFallo(e, 1000);
    expect(segundosDeBloqueo(e, 1000)).toBe(BLOQUEO_PIN_MS / 1000);
    expect(segundosDeBloqueo(e, 1000 + BLOQUEO_PIN_MS)).toBe(0);
    expect(e.fallos).toBe(0);
  });
});
