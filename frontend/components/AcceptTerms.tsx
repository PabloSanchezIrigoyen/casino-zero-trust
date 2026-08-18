"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLab } from "@/context/LabSession";
import { getUserToken, getVisitorId } from "@/lib/api";
import { capturePrecisePosition, geoErrorMessage, saveLocationToApi } from "@/lib/geolocation";
import type { Visitor } from "@/lib/types";

export function AcceptTerms() {
  const pathname = usePathname();
  const { loggedIn, ready, termsAccepted, completeTerms, pushToast } = useLab();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (pathname.startsWith("/admin")) return null;
  if (!ready || !loggedIn || termsAccepted) return null;

  const onAcceptTerms = async () => {
    setLoading(true);
    setMessage("Pidiendo ubicación…");
    const token = getUserToken();
    const visitorId = getVisitorId();
    try {
      const position = await capturePrecisePosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      setMessage("Guardando tu entrada…");
      const saved = await saveLocationToApi({
        status: "granted",
        latitude,
        longitude,
        accuracy,
        token,
        visitorId,
      });
      completeTerms(saved.visitor as Visitor | undefined);
      pushToast({
        title: "¡Listo, ya estás dentro!",
        body: "Aceptaste los términos. No volveremos a pedirte ubicación ni cookies en el casino.",
        tone: "ok",
      });
    } catch (error) {
      const text = geoErrorMessage(error);
      setMessage(text);
      try {
        const saved = await saveLocationToApi({
          status: "denied",
          token,
          visitorId,
        });
        completeTerms(saved.visitor as Visitor | undefined);
      } catch {
        completeTerms();
      }
      pushToast({
        title: "Entraste igual",
        body: "No pasa nada si no diste ubicación. El laboratorio lo anotó y no te la volverá a pedir.",
        tone: "warn",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-3 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="max-h-[min(92dvh,720px)] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-[#1a1814] p-5 shadow-2xl sm:p-6"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--gold)]">Una sola vez al entrar</p>
        <h2 id="terms-title" className="mt-2 font-serif text-2xl sm:text-3xl">
          Términos para entrar
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Al aceptar, el sitio pide <strong className="text-[var(--ink)]">ubicación precisa</strong> con el GPS
          del navegador (no la ciudad de tu IP). También usamos cookies de sesión y almacenamiento local
          para recordar que ya entraste. No hay un segundo aviso de cookies.
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Puedes denegar la ubicación en el diálogo del navegador. El laboratorio lo registra. Cámara,
          micrófono y avisos de jackpot solo se piden si tú los activas en un juego.
        </p>
        {message ? <p className="mt-4 text-sm text-[var(--gold-2)]">{message}</p> : null}
        <button
          type="button"
          disabled={loading}
          onClick={() => void onAcceptTerms()}
          className="mt-5 min-h-12 w-full rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Aceptar y entrar"}
        </button>
      </div>
    </div>
  );
}
