"use client";

import { usePathname } from "next/navigation";
import { useLab } from "@/context/LabSession";

export function ConsentBar() {
  const pathname = usePathname();
  const { loggedIn, ready, cookieChoice, visitor, termsAccepted, setCookieChoice } = useLab();

  if (pathname.startsWith("/admin")) return null;
  if (!ready || !loggedIn || !termsAccepted || cookieChoice !== null) return null;
  if (visitor?.cookieConsentAt) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-title"
        className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#1a1814] p-6 shadow-2xl"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Aviso de cookies</p>
        <h2 id="cookie-title" className="mt-2 font-serif text-3xl">
          Este sitio usa cookies
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Usamos cookies de sesión y, si aceptas, también localStorage: guardar en este
          navegador que ya entraste (no es un permiso nativo como cámara o GPS). No es
          publicidad. El administrador verá tu decisión.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void setCookieChoice(false)}
            className="rounded-xl border border-white/20 px-4 py-3 text-sm"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => void setCookieChoice(true)}
            className="rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-black"
          >
            Aceptar cookies
          </button>
        </div>
      </div>
    </div>
  );
}
