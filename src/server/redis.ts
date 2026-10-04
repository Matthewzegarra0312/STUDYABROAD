// Upstash Redis (PLAN.md, sección 1 y 2). Si faltan las variables de
// entorno (desarrollo local, o un preview sin la integración de
// Vercel/Upstash conectada), el canje funciona sin límite de usos y lo
// avisa en consola una sola vez.
import { Redis } from "@upstash/redis";
import { MAX_DISPOSITIVOS, MAX_INTENTOS_FALLIDOS, VENTANA_INTENTOS_SEGUNDOS } from "./canje";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redisDisponible = Boolean(url && token);

const redis = redisDisponible ? new Redis({ url: url!, token: token! }) : null;

let avisado = false;
function avisarSinLimite() {
  if (avisado) return;
  avisado = true;
  console.warn(
    "[canje] Faltan UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN: " +
      "el canje funciona sin límite de dispositivos ni de intentos fallidos.",
  );
}

export type ResultadoActivacion = "ok" | "limite";

/**
 * Registra que `deviceId` activó el código `hash`. Usa un SET en Redis
 * (`canje:<hash>`) para no contar dos veces el mismo dispositivo
 * (PLAN.md: "suma 1 al contador... si es un dispositivo nuevo"). Sin
 * Redis, siempre permite (sin límite).
 */
export async function registrarActivacion(hash: string, deviceId: string): Promise<ResultadoActivacion> {
  if (!redis) {
    avisarSinLimite();
    return "ok";
  }
  const clave = `canje:${hash}`;
  const yaEsMiembro = (await redis.sismember(clave, deviceId)) === 1;
  if (yaEsMiembro) return "ok";

  const total = await redis.scard(clave);
  if (total >= MAX_DISPOSITIVOS) return "limite";

  await redis.sadd(clave, deviceId);
  return "ok";
}

/** Cuántos dispositivos distintos activaron este código hasta ahora. */
export async function dispositivosActivados(hash: string): Promise<number> {
  if (!redis) return 0;
  return redis.scard(`canje:${hash}`);
}

/**
 * Máximo 10 intentos fallidos por IP cada 10 minutos (PLAN.md, sección 2).
 * Sin Redis, nunca bloquea.
 */
export async function intentosSuperados(ip: string): Promise<boolean> {
  if (!redis) {
    avisarSinLimite();
    return false;
  }
  const clave = `intentos:${ip}`;
  const total = await redis.incr(clave);
  if (total === 1) {
    await redis.expire(clave, VENTANA_INTENTOS_SEGUNDOS);
  }
  return total > MAX_INTENTOS_FALLIDOS;
}

/**
 * Total de códigos canjeados: métrica de asistentes que completaron el
 * recorrido de stands (PLAN.md, sección 2). Cuenta las claves
 * "canje:<hash>" que tengan al menos un dispositivo.
 */
export async function totalCanjes(): Promise<number | null> {
  if (!redis) return null;
  let cursor = 0;
  let total = 0;
  do {
    const [siguiente, claves] = await redis.scan(cursor, { match: "canje:*", count: 200 });
    cursor = Number(siguiente);
    total += claves.length;
  } while (cursor !== 0);
  return total;
}

/**
 * Máximo `limite` subidas de badge por IP cada hora (/api/badge-upload).
 * Sin Redis, nunca bloquea.
 */
export async function subidasBadgeSuperadas(ip: string, limite: number): Promise<boolean> {
  if (!redis) {
    avisarSinLimite();
    return false;
  }
  const clave = `badge-subidas:${ip}`;
  const total = await redis.incr(clave);
  if (total === 1) {
    await redis.expire(clave, 60 * 60);
  }
  return total > limite;
}
