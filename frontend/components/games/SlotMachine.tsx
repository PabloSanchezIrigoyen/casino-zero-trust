"use client";

import { useMemo, useState } from "react";
import { useLab } from "@/context/LabSession";

const SYMBOLS = [
  { id: "seven", label: "7", color: "#c23b3b" },
  { id: "diamond", label: "◆", color: "#7ec8e3" },
  { id: "cherry", label: "●", color: "#e05a5a" },
  { id: "bar", label: "BAR", color: "#f0d789" },
  { id: "star", label: "★", color: "#c9a227" },
  { id: "lemon", label: "◐", color: "#d6c25a" },
];

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

export function SlotMachine() {
  const { requestNotifications, visitor, pushToast } = useLab();
  const [reels, setReels] = useState(() => [SYMBOLS[0], SYMBOLS[1], SYMBOLS[4]]);
  const [spinning, setSpinning] = useState(false);
  const [credits, setCredits] = useState(50);
  const strip = useMemo(() => [...SYMBOLS, ...SYMBOLS, ...SYMBOLS], []);

  const spin = () => {
    if (spinning || credits < 5) return;
    setSpinning(true);
    setCredits((c) => c - 5);
    const next = [randomSymbol(), randomSymbol(), randomSymbol()];
    window.setTimeout(() => {
      setReels(next);
      setSpinning(false);
      const win = next[0].id === next[1].id && next[1].id === next[2].id;
      if (win) {
        setCredits((c) => c + 40);
        pushToast({ title: "¡Tres iguales!", body: "Jackpot de laboratorio. Las fichas son de mentira.", tone: "ok" });
        if (visitor?.notificationStatus === "granted") {
          new Notification("Jackpot Zero Trust", { body: "Premio ficticio. Gracias por jugar en el laboratorio." });
        }
      }
    }, 1400);
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[#14110c] p-4 sm:rounded-3xl sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--gold)]">Tragamonedas</p>
          <h2 className="font-serif text-2xl sm:text-3xl">Aurum Reels</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">Fichas: {credits}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 overflow-hidden rounded-2xl border border-[var(--gold)]/30 bg-black p-2 sm:mt-5 sm:gap-3 sm:p-3">
        {reels.map((symbol, i) => (
          <div key={i} className="relative h-28 overflow-hidden rounded-xl bg-[#1b1812] sm:h-40">
            <div
              className="absolute inset-x-0 top-0"
              style={{
                animationName: spinning ? "spin-reel" : "none",
                animationDuration: "0.35s",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${i * 80}ms`,
              }}
            >
              {spinning
                ? strip.map((item, idx) => (
                    <div key={idx} className="grid h-16 place-items-center font-serif text-3xl sm:h-20 sm:text-4xl" style={{ color: item.color }}>
                      {item.label}
                    </div>
                  ))
                : (
                    <div className="grid h-28 place-items-center font-serif text-4xl sm:h-40 sm:text-6xl" style={{ color: symbol.color }}>
                      {symbol.label}
                    </div>
                  )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-3">
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="min-h-12 rounded-xl bg-[var(--gold)] px-5 py-3 font-semibold text-black disabled:opacity-50"
        >
          Girar · 5 fichas
        </button>
        <button
          type="button"
          onClick={() =>
            void requestNotifications("Alertas de jackpot en Aurum Reels.")
          }
          className="min-h-12 rounded-xl border border-white/15 px-5 py-3 text-sm"
        >
          {visitor?.notificationStatus === "granted" ? "Alertas ya activas" : "Activar avisos de jackpot"}
        </button>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Los avisos salen con el diálogo nativo del navegador. Si alguna vez pulsaste Bloquear, ábrelo en el candado de la barra.
      </p>
    </div>
  );
}
