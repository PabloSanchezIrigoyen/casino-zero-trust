"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLab } from "@/context/LabSession";
import { getUserToken, getVisitorId } from "@/lib/api";
import { capturePrecisePosition, geoErrorMessage, saveLocationToApi } from "@/lib/geolocation";
import { locationKind } from "@/lib/permissions";
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
    setMessage("Esperando GPS preciso. En una computadora puede quedar solo la red…");
    const token = getUserToken();
    const visitorId = getVisitorId();
    try {
      const position = await capturePrecisePosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      setMessage("Guardando coordenadas en el laboratorio…");
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
        title: "Términos aceptados",
        body: `${locationKind(accuracy)}: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (${Math.round(accuracy)} m).`,
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
        title: "Términos aceptados, ubicación no concedida",
        body: text,
        tone: "warn",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#1a1814] p-6 shadow-2xl"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Términos del laboratorio</p>
        <h2 id="terms-title" className="mt-2 font-serif text-3xl">
          Aceptar términos y condiciones
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Al aceptar, el sitio pedirá tu <strong className="text-[var(--ink)]">ubicación precisa</strong> con{" "}
          <code className="text-[var(--gold)]">navigator.geolocation</code> (GPS del navegador, no la ciudad de
          la IP). El administrador verá latitud, longitud y precisión. Puedes denegar el permiso del
          navegador; el laboratorio lo registrará.
        </p>
        {message ? <p className="mt-4 text-sm text-[var(--gold-2)]">{message}</p> : null}
        <button
          type="button"
          disabled={loading}
          onClick={() => void onAcceptTerms()}
          className="mt-6 w-full rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Obteniendo ubicación…" : "Aceptar términos"}
        </button>
      </div>
    </div>
  );
}
