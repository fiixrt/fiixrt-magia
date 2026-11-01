// Plugin de desarrollo: sirve /api/* con las mismas funciones que despliega
// Vercel, para poder probar el atajo contra `npm run dev` sin `vercel dev`.
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function parseBody(req) {
  if (req.method !== "POST" && req.method !== "PUT" && req.method !== "PATCH") return {};
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export default function devApi() {
  return {
    name: "magia-dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();

        const route = url.pathname.slice("/api/".length).replace(/\/+$/, "");
        const file = join(ROOT, "api", `${route}.js`);
        if (!route || !existsSync(file)) return next();

        req.query = Object.fromEntries(url.searchParams.entries());
        req.body = await parseBody(req);

        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(data));
          return res;
        };

        try {
          const module = await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
          await module.default(req, res);
        } catch (error) {
          if (!res.headersSent) res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: String(error?.message || error) }));
        }
      });
    },
  };
}
