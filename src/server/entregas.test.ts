import { describe, expect, it } from "vitest";
import { entregasACsv, validarEntrega } from "./entregas";

const IDS = ["a", "b"];
const ISO = "2026-10-10T19:30:00.000Z";
const base = () => ({ numero: "P-7K2QM", nombre: "  Ana Quispe  ", sellos: { a: ISO, b: ISO }, canjeadoEl: ISO });
const AHORA = new Date("2026-10-10T21:00:00Z");

describe("validarEntrega", () => {
  it("acepta una entrega completa y normaliza el nombre", () => {
    const e = validarEntrega(base(), IDS, AHORA);
    expect(e).toMatchObject({ numero: "P-7K2QM", nombre: "Ana Quispe", canjeadoEl: ISO, registradoEl: AHORA.toISOString() });
    expect(Object.keys(e!.sellos)).toEqual(IDS);
  });

  it("rechaza lo que no cuadra", () => {
    expect(validarEntrega(null, IDS)).toBeNull();
    expect(validarEntrega({ ...base(), numero: "P-00000" }, IDS)).toBeNull();
    expect(validarEntrega({ ...base(), numero: "x" }, IDS)).toBeNull();
    expect(validarEntrega({ ...base(), nombre: "   " }, IDS)).toBeNull();
    expect(validarEntrega({ ...base(), nombre: "x".repeat(121) }, IDS)).toBeNull();
    expect(validarEntrega({ ...base(), sellos: { a: ISO } }, IDS)).toBeNull();
    expect(validarEntrega({ ...base(), sellos: { a: ISO, b: "no es fecha" } }, IDS)).toBeNull();
    expect(validarEntrega({ ...base(), canjeadoEl: "ayer" }, IDS)).toBeNull();
  });

  it("no deja pasar campos extra: no guarda el código del pase ni el PIN", () => {
    const e = validarEntrega({ ...base(), codigo: "7K3QD-M9X2Q", pin: "7305" }, IDS, AHORA)!;
    expect(JSON.stringify(e)).not.toMatch(/7K3QD|7305/);
  });
});

describe("entregasACsv", () => {
  it("ordena por hora de entrega y escapa comas y comillas", () => {
    const e1 = { ...validarEntrega(base(), IDS, AHORA)!, canjeadoEl: "2026-10-10T21:00:00.000Z" };
    const e2 = { ...validarEntrega({ ...base(), numero: "P-AAAAA", nombre: 'Luz "Lu", Pérez' }, IDS, AHORA)!, canjeadoEl: "2026-10-10T20:00:00.000Z" };
    const csv = entregasACsv([e1, e2], IDS);
    const filas = csv.replace("﻿", "").trim().split("\r\n");
    expect(filas[0]).toBe("N° de pasaporte,Nombre,Entregado el (ISO),Registrado el (ISO),Sello a,Sello b");
    expect(filas[1]).toContain('P-AAAAA,"Luz ""Lu"", Pérez"');
    expect(filas[2]).toContain("P-7K2QM,Ana Quispe");
  });
});
