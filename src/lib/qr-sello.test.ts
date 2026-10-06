import { beforeAll, describe, expect, it } from "vitest";
import { hashClave } from "./pasaporte";
import { interpretarQr } from "./qr-sello";

const ORIGEN = "https://studyabroad.leadutp.org";

describe("interpretarQr", () => {
  let hashes: Record<string, string> = {};
  beforeAll(async () => {
    hashes = { "study-in-japan": await hashClave("CLAVEJAPON000001"), educationusa: await hashClave("CLAVEUSA00000002") };
  });

  it("acepta la URL del stand con su clave", async () => {
    expect(await interpretarQr(`${ORIGEN}/stamp/study-in-japan?k=CLAVEJAPON000001`, ORIGEN, hashes)).toEqual({
      standId: "study-in-japan",
      destino: "/stamp/study-in-japan?k=CLAVEJAPON000001",
    });
  });

  it("rechaza otro origen, otra ruta, clave falsa, clave de otro stand y texto que no es URL", async () => {
    expect(await interpretarQr("https://otro.com/stamp/study-in-japan?k=CLAVEJAPON000001", ORIGEN, hashes)).toBeNull();
    expect(await interpretarQr(`${ORIGEN}/pase?k=CLAVEJAPON000001`, ORIGEN, hashes)).toBeNull();
    expect(await interpretarQr(`${ORIGEN}/stamp/study-in-japan?k=FALSA`, ORIGEN, hashes)).toBeNull();
    expect(await interpretarQr(`${ORIGEN}/stamp/study-in-japan?k=CLAVEUSA00000002`, ORIGEN, hashes)).toBeNull();
    expect(await interpretarQr(`${ORIGEN}/stamp/study-in-japan`, ORIGEN, hashes)).toBeNull();
    expect(await interpretarQr(`${ORIGEN}/stamp/desconocido?k=CLAVEJAPON000001`, ORIGEN, hashes)).toBeNull();
    expect(await interpretarQr("hola", ORIGEN, hashes)).toBeNull();
    expect(await interpretarQr("javascript:alert(1)", ORIGEN, hashes)).toBeNull();
  });
});
