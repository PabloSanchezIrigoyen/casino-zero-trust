"use client";

import { useLab } from "@/context/LabSession";

const tones = {
  info: "border-sky-500/40 bg-sky-500/10",
  ok: "border-emerald-500/40 bg-emerald-500/10",
  warn: "border-amber-500/40 bg-amber-500/10",
  danger: "border-red-500/40 bg-red-500/10",
};

export function Toasts() {
  const { toasts, dismissToast } = useLab();
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(92vw,380px)] flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 text-left shadow-xl ${tones[toast.tone]}`}
        >
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{toast.body}</p>
        </button>
      ))}
    </div>
  );
}
