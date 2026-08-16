"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLab } from "@/context/LabSession";

const links = [
  { href: "/casino", label: "Lobby" },
  { href: "/awareness", label: "Concientización" },
  { href: "/privacy", label: "Aviso" },
  { href: "/seguridad", label: "Seguridad" },
  { href: "/admin/login", label: "Admin", gold: true },
];

export function SiteHeader() {
  const { loggedIn, logout } = useLab();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)] sm:h-10 sm:w-10">
            ⌖
          </div>
          <div className="min-w-0">
            <p className="font-serif text-base leading-tight tracking-wide sm:text-lg">Casino Zero Trust</p>
            <p className="hidden text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] sm:block">
              Laboratorio ético · no malicioso
            </p>
          </div>
        </Link>
        {loggedIn && !pathname.startsWith("/admin") ? (
          <button
            type="button"
            onClick={logout}
            className="ml-auto rounded-lg px-2 py-1.5 text-sm text-red-300 sm:hidden"
          >
            Salir
          </button>
        ) : null}
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-[var(--line)] px-2 py-1.5 text-sm sm:justify-center sm:gap-2 sm:px-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-lg px-3 py-2 ${
              pathname === link.href || pathname.startsWith(`${link.href}/`)
                ? "bg-white/10 text-[var(--ink)]"
                : link.gold
                  ? "text-[var(--gold)]"
                  : "text-[var(--muted)]"
            }`}
          >
            {link.label}
          </Link>
        ))}
        {loggedIn ? (
          <button
            type="button"
            onClick={logout}
            className="hidden shrink-0 rounded-lg px-3 py-2 text-red-300 sm:inline"
          >
            Salir
          </button>
        ) : null}
      </nav>
    </header>
  );
}
