import type { APIRoute } from "astro";
import mesaDatos from "../../../data/mesa.json";
import { gates } from "../../../data/schedule";
import { verificarPin } from "../../../lib/mesa";
import { validarEntrega } from "../../../server/entregas";
import { guardarEntrega, pinMesaBloqueado, registrarFalloPinMesa } from "../../../server/redis";

// POST /api/mesa/entrega: la mesa de canje registra que un pasaporte completo recibió
// su código. Lo llama el celular del asistente cuando el voluntario marca "Código
// entregado". El PIN se vuelve a verificar aquí: sin el PIN del equipo no se guarda
// nada. Idempotente por número de pasaporte. No usa cookies ni guarda el PIN.
export const prerender = false;

const IDS_STANDS = gates.map((g) => g.standId);

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let ip = "desconocida";
  try {
    if (typeof clientAddress === "string" && clientAddress.length > 0) ip = clientAddress;
  } catch {
    // el adaptador no expone clientAddress en este contexto
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return json(400, { ok: false, error: "formato" });
  }

  if (await pinMesaBloqueado(ip)) return json(429, { ok: false, error: "intentos" });

  const pin = (cuerpo as { pin?: unknown } | null)?.pin;
  if (typeof pin !== "string" || !(await verificarPin(pin, mesaDatos))) {
    await registrarFalloPinMesa(ip);
    return json(401, { ok: false, error: "pin" });
  }

  const entrega = validarEntrega(cuerpo, IDS_STANDS);
  if (!entrega) return json(400, { ok: false, error: "datos" });

  try {
    const r = await guardarEntrega(entrega);
    if (r === "sin-almacen") return json(503, { ok: false, error: "sin-almacen" });
    return json(200, { ok: true, yaRegistrada: r === "ya-registrada" });
  } catch {
    return json(503, { ok: false, error: "almacen" });
  }
};
