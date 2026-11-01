// Almacén de la carta actual.
//
// En Vercel las funciones no comparten memoria entre invocaciones, así que el
// estado vive en Upstash Redis (REST). En desarrollo (o si no hay variables de
// entorno) se usa memoria del proceso, suficiente para probar en local.

const STATE_KEY = "magia:card";

const REST_URL = (
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  ""
).replace(/\/$/, "");

const REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

export function hasStore() {
  return Boolean(REST_URL && REST_TOKEN);
}

export function storeName() {
  return hasStore() ? "upstash" : "memory";
}

async function redis(command) {
  const response = await fetch(REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Upstash ${response.status}: ${detail.slice(0, 160)}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export async function readState() {
  if (!hasStore()) return globalThis.__MAGIA_CARD__ ?? null;
  const raw = await redis(["GET", STATE_KEY]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeState(state) {
  const payload = JSON.stringify(state);
  if (!hasStore()) {
    globalThis.__MAGIA_CARD__ = state;
    return state;
  }
  await redis(["SET", STATE_KEY, payload]);
  return state;
}

export async function clearState() {
  if (!hasStore()) {
    globalThis.__MAGIA_CARD__ = null;
    return null;
  }
  await redis(["DEL", STATE_KEY]);
  return null;
}
