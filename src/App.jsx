import { useEffect, useRef, useState } from "react";
import { SUITS, VALUES } from "../lib/cards.js";

const FAST_POLL_MS = 800; // recién cargada / recién cambió la carta
const SLOW_POLL_MS = 2200; // llevamos un rato sin cambios
const IDLE_AFTER_MS = 45000;
const HIDDEN_POLL_MS = 6000;

const ALL_CARDS = VALUES.flatMap((value) => Object.keys(SUITS).map((suit) => `/cards/${value}-${suit}.png`));

export default function App() {
  const [card, setCard] = useState(undefined); // undefined = cargando · null = sin carta
  const [status, setStatus] = useState("connecting");
  const lastChangeAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    let handle;

    const load = async () => {
      try {
        const response = await fetch(`/api/now?t=${Date.now()}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "respuesta inválida");
        if (cancelled) return;
        setStatus("online");
        setCard((previous) => {
          const next = data.card ?? null;
          const same = (previous?.code ?? null) === (next?.code ?? null) && (previous?.at ?? null) === (next?.at ?? null);
          if (!same) lastChangeAt.current = Date.now();
          return same ? previous : next;
        });
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };

    const loop = async () => {
      if (cancelled) return;
      if (!document.hidden) await load();
      if (cancelled) return;
      const idle = Date.now() - lastChangeAt.current;
      const delay = document.hidden ? HIDDEN_POLL_MS : idle > IDLE_AFTER_MS ? SLOW_POLL_MS : FAST_POLL_MS;
      handle = setTimeout(loop, delay);
    };

    const refreshNow = () => {
      if (!document.hidden) load();
    };

    loop();
    document.addEventListener("visibilitychange", refreshNow);
    window.addEventListener("focus", refreshNow);
    window.addEventListener("online", refreshNow);

    return () => {
      cancelled = true;
      clearTimeout(handle);
      document.removeEventListener("visibilitychange", refreshNow);
      window.removeEventListener("focus", refreshNow);
      window.removeEventListener("online", refreshNow);
    };
  }, []);

  // Calienta la caché de las 52 cartas para que el cambio sea instantáneo.
  useEffect(() => {
    const timers = ALL_CARDS.map((src, index) =>
      setTimeout(() => {
        const image = new Image();
        image.src = src;
      }, 1500 + index * 120),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="stage">
      <div className="halo" aria-hidden="true" />

      {card ? (
        <figure className="dealt" key={`${card.code}-${card.at}`}>
          <img className="card" src={card.image} alt={card.label} draggable="false" />
        </figure>
      ) : (
        <div className="waiting">
          <span className="waiting-mark">✧</span>
          <span className="waiting-text">Esperando carta</span>
        </div>
      )}

      <span
        className={`status ${status}`}
        role="status"
        aria-label={status === "online" ? "Conectado" : status === "offline" ? "Sin conexión" : "Conectando"}
      />
    </main>
  );
}
