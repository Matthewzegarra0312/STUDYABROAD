import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

const put = vi.fn(async (pathname: string, _cuerpo?: unknown, _opciones?: Record<string, unknown>) => ({ url: `https://blob.test/${pathname}`, pathname }));
const head = vi.fn();
const get = vi.fn();
class BlobNotFoundError extends Error {}
vi.mock("@vercel/blob", () => ({ put, head, get, BlobNotFoundError }));

const subidasBadgeSuperadas = vi.fn(async () => false);
vi.mock("./redis", () => ({ subidasBadgeSuperadas }));

const { medidasJpeg, medidasPng } = await import("./imagen");
const { generarIdBadge, ID_BADGE_RE, obtenerBadge, validarSubida } = await import("./badges");
const { POST } = await import("../pages/api/badge-upload");

const png = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: "#3B99D8" } }).png().toBuffer();
const jpg = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: "#3B99D8" } }).jpeg().toBuffer();

const archivo = (bytes: Buffer, tipo: string, nombre: string) => new File([new Uint8Array(bytes)], nombre, { type: tipo });

async function formulario(opts: { badge?: File; preview?: File } = {}) {
  const f = new FormData();
  f.set("badge", opts.badge ?? archivo(await png(1080, 1350), "image/png", "badge.png"));
  f.set("preview", opts.preview ?? archivo(await jpg(1200, 627), "image/jpeg", "preview.jpg"));
  return f;
}

const llamar = (form: FormData, headers: Record<string, string> = {}) =>
  POST({ request: new Request("http://localhost/api/badge-upload", { method: "POST", body: form, headers }), clientAddress: "1.2.3.4" } as never);

beforeEach(() => {
  put.mockClear();
  head.mockReset();
  subidasBadgeSuperadas.mockReset();
  subidasBadgeSuperadas.mockResolvedValue(false);
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

describe("medidas de imagen", () => {
  it("lee las medidas de un PNG y de un JPG", async () => {
    expect(medidasPng(new Uint8Array(await png(1080, 1350)))).toEqual({ width: 1080, height: 1350 });
    expect(medidasJpeg(new Uint8Array(await jpg(1200, 627)))).toEqual({ width: 1200, height: 627 });
  });

  it("no confunde formatos ni acepta basura", async () => {
    expect(medidasPng(new Uint8Array(await jpg(10, 10)))).toBeNull();
    expect(medidasJpeg(new Uint8Array(await png(10, 10)))).toBeNull();
    expect(medidasPng(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(medidasJpeg(new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
  });
});

describe("generarIdBadge", () => {
  it("genera ids de 12 caracteres, distintos y con el formato esperado", () => {
    const ids = new Set(Array.from({ length: 2000 }, generarIdBadge));
    expect(ids.size).toBe(2000);
    for (const id of ids) expect(id).toMatch(ID_BADGE_RE);
  });
});

describe("validarSubida", () => {
  it("acepta el badge y la vista previa con las medidas exactas", async () => {
    expect((await validarSubida(await formulario())).ok).toBe(true);
  });

  it("rechaza medidas distintas", async () => {
    const mal = await formulario({ badge: archivo(await png(1000, 1350), "image/png", "b.png") });
    expect(await validarSubida(mal)).toEqual({ ok: false, error: "medidas" });
    const mal2 = await formulario({ preview: archivo(await jpg(1200, 630), "image/jpeg", "p.jpg") });
    expect(await validarSubida(mal2)).toEqual({ ok: false, error: "medidas" });
  });

  it("rechaza tipos distintos y bytes que no coinciden con el tipo declarado", async () => {
    const webp = await sharp({ create: { width: 1080, height: 1350, channels: 3, background: "#fff" } }).webp().toBuffer();
    expect(await validarSubida(await formulario({ badge: archivo(webp, "image/webp", "b.webp") }))).toEqual({ ok: false, error: "tipo" });
    // Declara PNG pero son bytes de JPG.
    const falso = await formulario({ badge: archivo(await jpg(1080, 1350), "image/png", "b.png") });
    expect(await validarSubida(falso)).toEqual({ ok: false, error: "tipo" });
  });

  it("rechaza archivos que superan el tamaño máximo y formularios incompletos", async () => {
    const grande = await formulario({ badge: archivo(Buffer.alloc(4 * 1024 * 1024 + 1), "image/png", "b.png") });
    expect(await validarSubida(grande)).toEqual({ ok: false, error: "tamano" });
    const incompleto = new FormData();
    incompleto.set("badge", archivo(await png(1080, 1350), "image/png", "b.png"));
    expect(await validarSubida(incompleto)).toEqual({ ok: false, error: "formato" });
  });
});

describe("POST /api/badge-upload", () => {
  it("responde 503 si falta BLOB_READ_WRITE_TOKEN, sin intentar subir", async () => {
    const res = await llamar(await formulario());
    expect(res.status).toBe(503);
    expect(put).not.toHaveBeenCalled();
  });

  it("guarda solo las dos imágenes en badges/<id>/ y responde { id }", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token-de-pruebas";
    const res = await llamar(await formulario());
    expect(res.status).toBe(200);
    const { id } = (await res.json()) as { id: string };
    expect(id).toMatch(ID_BADGE_RE);
    expect(put.mock.calls.map((c) => c[0])).toEqual([`badges/${id}/badge.png`, `badges/${id}/preview.jpg`]);
    expect(put.mock.calls[0]?.[2]).toMatchObject({ access: "private", allowOverwrite: false, addRandomSuffix: false, contentType: "image/png" });
  });

  it("rechaza con 400 las medidas incorrectas y con 413 los cuerpos enormes", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token-de-pruebas";
    const mal = await formulario({ badge: archivo(await png(540, 675), "image/png", "b.png") });
    expect((await llamar(mal)).status).toBe(400);
    expect((await llamar(await formulario(), { "content-length": String(50 * 1024 * 1024) })).status).toBe(413);
    expect(put).not.toHaveBeenCalled();
  });

  it("responde 429 cuando la IP supera el límite, antes de leer el cuerpo", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token-de-pruebas";
    subidasBadgeSuperadas.mockResolvedValue(true);
    const res = await llamar(await formulario());
    expect(res.status).toBe(429);
    expect(subidasBadgeSuperadas).toHaveBeenCalledWith("1.2.3.4", 10);
    expect(put).not.toHaveBeenCalled();
  });
});

describe("obtenerBadge", () => {
  it("devuelve las URL si existen y null si no existe o el id no tiene el formato", async () => {
    head.mockImplementation(async (p: string) => ({ url: `https://blob.test/${p}` }));
    const id = generarIdBadge();
    expect(await obtenerBadge(id)).toEqual({ badgeUrl: `/b/${id}/badge.png`, previewUrl: `/b/${id}/preview.jpg` });
    expect(await obtenerBadge("../secreto")).toBeNull();
    head.mockRejectedValue(new BlobNotFoundError("no existe"));
    expect(await obtenerBadge(id)).toBeNull();
  });
});
