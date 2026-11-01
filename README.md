# 🃏 fiixrt-magia

Web para un truco de cartas: un atajo de iOS envía una carta y la web (en cualquier móvil) la muestra
a pantalla completa en menos de un segundo. Solo se ve la carta.

- **Front:** React + Vite, pensado para móvil, mismo lenguaje visual que el dashboard de atajos.
- **API:** funciones serverless de Vercel (`/api/set` para escribir, `/api/now` para leer).
- **Estado:** Upstash Redis vía REST (las funciones de Vercel no comparten memoria). Sin configurar,
  cae a memoria del proceso: perfecto para desarrollo, **no** para producción.

## En producción

- **Web:** <https://fiixrt-magia.vercel.app> — desplegada desde `main` de
  <https://github.com/fiixrt/fiixrt-magia>.
- **Estado:** Upstash Redis conectado (`KV_REST_API_URL` + `KV_REST_API_TOKEN`), `MAGIA_KEY` activa.
- **Atajo:** `https://fiixrt-magia.vercel.app/api/set?c=Q-2&k=CLAVE` → [ATAJOS.md](ATAJOS.md).
- **Dashboard:** tarjeta **Truco de Magia** en `http://192.168.1.45:7778` con el botón *Ver carta actual*.

```
api/set.js       GET/POST ?c=Q-2&k=CLAVE  → fija la carta
api/now.js       GET                      → carta actual en JSON
lib/cards.js     normaliza cartas (Q-2, A♠, 10H, "as de picas"…)
lib/store.js     Upstash REST + fallback en memoria
src/App.jsx      pantalla de la carta + polling adaptativo
public/cards/    52 cartas recortadas de poker-v2.png
ATAJOS.md        cómo montar el atajo de iOS
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5199 (incluye /api/* emulado)
```

El plugin `scripts/dev-api.js` sirve las mismas funciones que despliega Vercel, así puedes probar el
atajo contra `http://192.168.1.34:5199/api/set?c=Q-2` desde el iPhone en la misma wifi.

Otras órdenes:

```bash
npm run build    # dist/
npm run preview  # sirve dist/
npm run cards    # regenera public/cards desde public/poker-v2.png (necesita Pillow)
```

## Montarlo desde cero

Ya está desplegado; esto es por si hay que rehacerlo en otra cuenta.

1. **GitHub** — importa el repo en `https://github.com/fiixrt/fiixrt-magia` y trabaja en `main`.
2. **Vercel** — *Add New → Project → Import Git Repository* y elige el repo. Detecta Vite solo
   (`npm run build` → `dist`). No hace falta tocar nada más.
3. **Upstash (imprescindible para que sea fiable en Vercel)**
   - Opción rápida: en Vercel → *Storage → Create Database → Upstash Redis*, conéctala al proyecto.
     Vercel añade `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
   - Opción manual: crea una base gratis en <https://console.upstash.com>, copia **UPSTASH_REDIS_REST_URL** y
     **UPSTASH_REDIS_REST_TOKEN** y pégalas en *Vercel → Settings → Environment Variables*.
   - La web acepta los dos juegos de nombres.
4. **Clave del atajo (recomendada)** — añade `MAGIA_KEY` con una palabra larga. El atajo tendrá que
   enviarla como `&k=...`. Mientras no exista la variable, `/api/set` acepta escrituras sin clave.
5. **Redeploy** y comprueba:

```bash
curl "https://fiixrt-magia.vercel.app/api/set?c=Q-2&k=CLAVE"
curl "https://fiixrt-magia.vercel.app/api/now"
```

Después, monta el atajo siguiendo [ATAJOS.md](ATAJOS.md).

## Cómo se mantiene “en directo”

La web consulta `/api/now` cada **800 ms** mientras está abierta y activa; si no cambia nada durante
45 s baja a 2,2 s, y con la pestaña en segundo plano a 6 s. Al volver a primer plano consulta al
instante. Las 52 cartas se precargan en segundo plano, así el cambio se pinta sin descargar imagen.

Si el indicador verde de la esquina se pone rojo, la web no llega a la API (sin datos o función caída).

## Dashboard de atajos

El dashboard (`http://192.168.1.45:7778`, contenedor `pc-power-controller`) tiene una tarjeta nueva
**Truco de Magia** con el botón **🃏 Ver carta actual**. Detecta sola la URL de Vercel desde los
deployments del repo; si no, se puede fijar:

```bash
docker exec pc-power-controller sh -c 'echo "{\"url\":\"https://fiixrt-magia.vercel.app\"}" > /app/magia_config.json'
```

o con la variable de entorno `MAGIA_VERCEL_URL` en el `docker-compose.yml`.
