"use client";

import Link from "next/link";
import { PermissionHud } from "./PermissionHud";
import { useLab } from "@/context/LabSession";
import { dispositivo } from "@/lib/labels";

export function SiteHeader() {
  const { visitor, loggedIn, logout } = useLab();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]">
            ⌖
          </div>
          <div>
            <Link href="/" className="font-serif text-lg tracking-wide">
              Casino Zero Trust
            </Link>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Laboratorio ético · no malicioso
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
          <Link href="/casino">Lobby</Link>
          <Link href="/awareness">Concientización</Link>
          <Link href="/privacy">Aviso</Link>
          <Link href="/seguridad">Seguridad</Link>
          <Link href="/admin/login" className="text-[var(--gold)]">
            Administrador
          </Link>
          {loggedIn ? (
            <button type="button" onClick={logout} className="text-red-300">
              Cerrar sesión
            </button>
          ) : null}
        </nav>
      </div>
      {visitor ? (
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-3">
          <PermissionHud />
          <p className="text-xs text-[var(--muted)]">
            {visitor.email} · {dispositivo(visitor.deviceType)} · visitas {visitor.visitCount} · IP{" "}
            {visitor.publicIp || visitor.lastIp || "…"}
          </p>
        </div>
      ) : null}
    </header>
  );
}
