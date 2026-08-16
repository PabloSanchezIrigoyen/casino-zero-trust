"use client";

import { useState } from "react";

const NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

type Bet = "red" | "black" | "green";

export function RouletteWheel() {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [bet, setBet] = useState<Bet>("red");
  const [credits, setCredits] = useState(50);
  const [message, setMessage] = useState("Elige color y lanza la bola.");

  const spin = () => {
    if (spinning || credits < 5) return;
    setSpinning(true);
    setCredits((c) => c - 5);
    const index = Math.floor(Math.random() * NUMBERS.length);
    const slice = 360 / NUMBERS.length;
    const next = 360 * 6 + (360 - index * slice);
    setAngle(next);
    window.setTimeout(() => {
      const number = NUMBERS[index];
      setResult(number);
      const color = number === 0 ? "green" : RED.has(number) ? "red" : "black";
      const win = color === bet;
      if (win) setCredits((c) => c + (bet === "green" ? 60 : 10));
      setMessage(win ? `Cayó ${number} (${color}). Premio ficticio.` : `Cayó ${number} (${color}). Sin premio.`);
      setSpinning(false);
    }, 3200);
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[#14110c] p-4 sm:rounded-3xl sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--gold)]">Ruleta</p>
          <h2 className="font-serif text-2xl sm:text-3xl">Orbita</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">Fichas: {credits}</p>
      </div>
      <div className="mt-5 grid items-center gap-5 md:mt-6 md:grid-cols-[280px_1fr] md:gap-6">
        <div className="relative mx-auto h-52 w-52 sm:h-64 sm:w-64">
          <div className="absolute left-1/2 top-0 z-10 h-6 w-1 -translate-x-1/2 rounded bg-[var(--gold)]" />
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full rounded-full border-4 border-[var(--gold)]"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 3.1s cubic-bezier(.15,.8,.1,1)" : "none",
            }}
          >
            {NUMBERS.map((n, i) => {
              const start = (i * 360) / NUMBERS.length;
              const color = n === 0 ? "#3d8b62" : RED.has(n) ? "#8b1e1e" : "#111";
              const a1 = ((start - 90) * Math.PI) / 180;
              const a2 = ((start + 360 / NUMBERS.length - 90) * Math.PI) / 180;
              const x1 = 100 + 100 * Math.cos(a1);
              const y1 = 100 + 100 * Math.sin(a1);
              const x2 = 100 + 100 * Math.cos(a2);
              const y2 = 100 + 100 * Math.sin(a2);
              return <path key={n} d={`M100,100 L${x1},${y1} A100,100 0 0 1 ${x2},${y2} Z`} fill={color} />;
            })}
            <circle cx="100" cy="100" r="28" fill="#0b0b0c" />
            <text x="100" y="105" textAnchor="middle" fill="#f0d789" fontSize="12">
              {result ?? "•"}
            </text>
          </svg>
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            {(["red", "black", "green"] as Bet[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setBet(item)}
                className={`min-h-11 rounded-xl px-4 py-2 text-sm capitalize ${
                  bet === item ? "bg-[var(--gold)] text-black" : "border border-white/15"
                }`}
              >
                {item === "red" ? "Rojo" : item === "black" ? "Negro" : "Cero"}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">{message}</p>
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className="mt-4 min-h-12 w-full rounded-xl bg-[var(--gold)] px-5 py-3 font-semibold text-black disabled:opacity-50 sm:w-auto"
          >
            Lanzar bola
          </button>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Las fichas son de laboratorio. La ubicación solo se pide al aceptar los términos de entrada.
          </p>
        </div>
      </div>
    </div>
  );
}
