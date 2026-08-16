"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("lab-casino-2026");
  const [error, setError] = useState("");

  return (
    <form
      className="mx-auto max-w-md rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        try {
          const data = await api.adminLogin(username, password);
          sessionStorage.setItem("zt_admin", data.token);
          router.push("/admin");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error");
        }
      }}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Administrador</p>
      <h1 className="mt-2 font-serif text-4xl">Entrar al panel</h1>
      <label className="mt-5 block text-sm">
        Usuario
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
        />
      </label>
      <label className="mt-4 block text-sm">
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <button type="submit" className="mt-5 w-full rounded-xl bg-[var(--gold)] py-3 font-semibold text-black">
        Entrar
      </button>
    </form>
  );
}
