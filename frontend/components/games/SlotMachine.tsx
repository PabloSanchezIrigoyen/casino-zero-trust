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
        pushToast({ title: "Jackpot de laboratorio", body: "Tres iguales. Las fichas son ficticias.", tone: "ok" });
        if (visitor?.notificationStatus === "granted") {
          new Notification("Jackpot Zero Trust", { body: "Premio ficticio. Revisa qué permiso lo hizo posible." });
        }
      }
    }, 1400);
  };

  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[#14110c] p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Tragamonedas</p>
          <h2 className="font-serif text-3xl">Aurum Reels</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">Fichas: {credits}</p>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 overflow-hidden rounded-2xl border border-[var(--gold)]/30 bg-black p-3">
        {reels.map((symbol, i) => (
          <div key={i} className="relative h-40 overflow-hidden rounded-xl bg-[#1b1812]">
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
                    <div key={idx} className="grid h-20 place-items-center font-serif text-4xl" style={{ color: item.color }}>
                      {item.label}
                    </div>
                  ))
                : (
                    <div className="grid h-40 place-items-center font-serif text-6xl" style={{ color: symbol.color }}>
                      {symbol.label}
                    </div>
                  )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="rounded-xl bg-[var(--gold)] px-5 py-3 font-semibold text-black disabled:opacity-50"
        >
          Girar · 5 fichas
        </button>
        <button
          type="button"
          onClick={() =>
            void requestNotifications("Alertas de jackpot en Aurum Reels. El navegador pedirá Notification.permission.")
          }
          className="rounded-xl border border-white/15 px-5 py-3 text-sm"
        >
          Activar alertas de jackpot
        </button>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Las alertas usan la API oficial de notificaciones. Si aceptas, el admin verá `notifications: granted`.
      </p>
    </div>
  );
}
