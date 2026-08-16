"use client";

import { useLab } from "@/context/LabSession";

const tones = {
  info: "border-sky-400/50 bg-[#13202c] text-sky-50",
  ok: "border-emerald-400/50 bg-[#13241c] text-emerald-50",
  warn: "border-amber-400/50 bg-[#2a2110] text-amber-50",
  danger: "border-red-400/50 bg-[#2a1414] text-red-50",
};

export function Toasts() {
  const { toasts, dismissToast } = useLab();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[90] flex flex-col-reverse gap-2 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-24 sm:w-[min(92vw,380px)] sm:flex-col">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className={`pointer-events-auto rounded-2xl border px-4 py-3.5 text-left shadow-2xl ${tones[toast.tone]}`}
        >
          <p className="text-sm font-semibold leading-snug sm:text-[15px]">{toast.title}</p>
          <p className="mt-1 text-[13px] leading-5 text-white/75">{toast.body}</p>
          <p className="mt-2 text-[11px] text-white/45">Toca para cerrar</p>
        </button>
      ))}
    </div>
  );
}
