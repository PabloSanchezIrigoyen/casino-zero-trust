"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PermissionHud } from "./PermissionHud";
import { useLab } from "@/context/LabSession";
import { dispositivo } from "@/lib/labels";

export function SiteHeader() {
  const { visitor, loggedIn, logout } = useLab();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]">
            ⌖
          </div>
          <div className="min-w-0">
            <Link href="/" className="font-serif text-lg tracking-wide">
              Casino Zero Trust
            </Link>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Laboratorio ético · no malicioso
            </p>
          </div>
        </div>
        <nav className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 text-sm text-[var(--muted)] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          <Link href="/casino" className="shrink-0">
            Lobby
          </Link>
          <Link href="/awareness" className="shrink-0">
            Concientización
          </Link>
          <Link href="/privacy" className="shrink-0">
            Aviso
          </Link>
          <Link href="/seguridad" className="shrink-0">
            Seguridad
          </Link>
          <Link href="/admin/login" className="shrink-0 text-[var(--gold)]">
            Admin
          </Link>
          {loggedIn ? (
            <button type="button" onClick={logout} className="shrink-0 text-red-300">
              Salir
            </button>
          ) : null}
        </nav>
      </div>
      {visitor && !isAdmin ? (
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <PermissionHud />
          <p className="text-xs text-[var(--muted)]">
            {visitor.email} · {dispositivo(visitor.deviceType)} · IP {visitor.publicIp || visitor.lastIp || "…"}
          </p>
        </div>
      ) : null}
    </header>
  );
}
