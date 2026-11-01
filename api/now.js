// GET /api/now — devuelve la carta que hay ahora mismo.
// Lo consulta la web (polling) y el dashboard de 192.168.1.45:7778.

import { readState, storeName } from "../lib/store.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const card = await readState();
    res.status(200).setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: true,
        card,
        store: storeName(),
        now: Date.now(),
      }),
    );
  } catch (error) {
    res.status(500).setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(error.message || error), store: storeName() }));
  }
}
