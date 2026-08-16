"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLab } from "@/context/LabSession";

export function LabGate() {
  const pathname = usePathname();
  const { loggedIn, ready, register, login } = useLab();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (pathname.startsWith("/admin")) return null;
  if (!ready || loggedIn) return null;

  const submit = async () => {
    setError("");
    if (mode === "register" && password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") await register(email, password);
      else await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/80 p-3 sm:place-items-center sm:p-4">
      <div className="max-h-[min(92dvh,760px)] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-2xl sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--red)]">Proyecto 2 · laboratorio</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl">NO es un sitio malicioso</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Laboratorio <strong className="text-[var(--ink)]">ético</strong>,{" "}
          <strong className="text-[var(--ink)]">controlado</strong> y{" "}
          <strong className="text-[var(--ink)]">educativo</strong>. Entras con correo y contraseña. Los
          permisos del navegador se piden con aviso. No se graba cámara ni micrófono.
        </p>
        <div className="mt-5 grid grid-cols-2 rounded-xl border border-white/10 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-lg py-2 ${mode === "register" ? "bg-[var(--gold)] font-semibold text-black" : ""}`}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg py-2 ${mode === "login" ? "bg-[var(--gold)] font-semibold text-black" : ""}`}
          >
            Ya tengo cuenta
          </button>
        </div>
        <label className="mt-4 block text-sm">
          Correo
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-[var(--gold)]"
          />
        </label>
        <label className="mt-3 block text-sm">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-[var(--gold)]"
          />
        </label>
        {mode === "register" ? (
          <label className="mt-3 block text-sm">
            Confirmar contraseña
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-[var(--gold)]"
            />
          </label>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          disabled={loading}
          onClick={() => void submit()}
          className="mt-5 min-h-12 w-full rounded-xl bg-[var(--gold)] px-4 py-3 font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Entrando…" : mode === "register" ? "Crear cuenta y entrar" : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}
