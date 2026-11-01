// POST/GET /api/set?c=Q-2&k=CLAVE
// Pone la carta que verá todo el mundo al instante.
//
// Formatos aceptados para "c":  Q-2 · A♠ · 10H · as de picas · 1-1 · reset

import { CLEAR_WORDS, isNoCard, parseCard } from "../lib/cards.js";
import { clearState, storeName, writeState } from "../lib/store.js";

function noCache(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization, x-magia-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function json(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  noCache(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const query = req.query || {};
  const body = readBody(req);

  const expectedKey = process.env.MAGIA_KEY || "";
  const providedKey =
    query.k || query.key || req.headers["x-magia-key"] || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");

  if (expectedKey && providedKey !== expectedKey) {
    json(res, 401, { ok: false, error: "Clave incorrecta (parámetro k)" });
    return;
  }

  const rawCard = body.c ?? body.carta ?? body.card ?? query.c ?? query.carta ?? query.card ?? "";
  const rawValue = body.valor ?? body.value ?? query.v ?? query.valor ?? query.value;
  const rawSuit = body.palo ?? body.suit ?? query.p ?? query.palo ?? query.suit;

  // «Ninguna» = el audio no mencionaba ninguna carta: no se toca lo que ya hay.
  if (isNoCard(rawCard)) {
    json(res, 200, { ok: true, card: null, skipped: "ninguna", store: storeName() });
    return;
  }

  const isEmpty = String(rawCard).trim() === "" && rawValue === undefined;
  const wantsClear = CLEAR_WORDS.includes(String(rawCard).trim().toLowerCase());

  if (isEmpty && !wantsClear) {
    json(res, 400, {
      ok: false,
      error: "Falta la carta. Usa ?c=Q-2 (valor-palo) o ?c=Reina+de+Corazones",
      ejemplo: "/api/set?c=Q-2",
    });
    return;
  }

  try {
    if (wantsClear) {
      await clearState();
      json(res, 200, { ok: true, card: null, cleared: true, store: storeName() });
      return;
    }

    const parsed =
      rawCard !== "" && rawCard !== undefined ? parseCard(rawCard) : parseCard({ valor: rawValue, palo: rawSuit });

    if (!parsed) {
      json(res, 400, {
        ok: false,
        error: `No he podido entender la carta "${rawCard}".`,
        formatos: ["Q-2", "A♠", "10H", "as de picas", "jota de diamantes"],
        palos: { 1: "picas", 2: "corazones", 3: "diamantes", 4: "tréboles" },
      });
      return;
    }

    const state = await writeState({
      ...parsed,
      at: Date.now(),
      nonce: Math.random().toString(36).slice(2, 8),
    });

    json(res, 200, {
      ok: true,
      card: state.code,
      label: state.label,
      at: state.at,
      store: storeName(),
    });
  } catch (error) {
    json(res, 500, { ok: false, error: String(error.message || error) });
  }
}
