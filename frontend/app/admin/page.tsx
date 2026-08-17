"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { dispositivo, enLinea, estadoCookie, estadoPermiso } from "@/lib/labels";
import type { Visitor } from "@/lib/types";

type Stats = {
  usuarios: number;
  visitas: number;
  eventos: number;
  camara: number;
  microfono: number;
  ubicacion: number;
  cookies: number;
};

type Filter = "all" | "online" | "gps" | "camera" | "mic";

function Permiso({ ok, label }: { ok: string | boolean; label: string }) {
  const state = typeof ok === "boolean" ? (ok ? "granted" : "denied") : ok;
  const color =
    state === "granted" ? "text-emerald-300" : state === "denied" ? "text-red-300" : "text-[var(--muted)]";
  return (
    <span className={`rounded-full border border-white/10 px-2 py-0.5 ${color}`}>
      {label} {estadoPermiso(String(state))}
    </span>
  );
}

function VisitorCard({ row }: { row: Visitor }) {
  const ip = row.publicIpv4 || row.publicIp || row.lastIp;
  return (
    <Link
      href={`/admin/visitors/${row.visitorId}`}
      className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 transition hover:border-[var(--gold)]/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-all font-medium text-[var(--gold)]">{row.email}</p>
        <span className={`shrink-0 text-[11px] ${enLinea(row) ? "text-emerald-300" : "text-[var(--muted)]"}`}>
          {enLinea(row) ? "en línea" : "fuera"}
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {dispositivo(row.deviceType)}
        {row.browser ? ` · ${row.browser}` : ""}
      </p>
      {row.deviceId ? <p className="mt-2 font-mono text-[11px] break-all text-[var(--gold-2)]">ID {row.deviceId}</p> : null}
      {ip ? <p className="mt-1 text-xs text-[var(--muted)]">Proveedor {ip}</p> : null}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        <Permiso label="Cámara" ok={row.cameraStatus} />
        <Permiso label="Mic" ok={row.microphoneStatus} />
        <Permiso label="GPS" ok={row.locationStatus} />
        <Permiso label="Cookies" ok={estadoCookie(row.cookieConsent, row.cookieConsentAt)} />
      </div>
      <p className="mt-auto pt-3 text-xs text-[var(--gold)]">Ver ficha →</p>
    </Link>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [q, setQ] = useState("");
  const [device, setDevice] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const saved = sessionStorage.getItem("zt_admin") || "";
    if (!saved) {
      router.replace("/admin/login");
      return;
    }
    setToken(saved);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const [s, v] = await Promise.all([
        api.adminStats(token) as Promise<Stats>,
        api.adminVisitors(token, q, device) as Promise<{ visitors: Visitor[] }>,
      ]);
      setStats(s);
      setVisitors(v.visitors);
    };
    void load().catch(() => router.replace("/admin/login"));
    const timer = window.setInterval(() => void load().catch(() => undefined), 8000);
    return () => window.clearInterval(timer);
  }, [token, q, device, router]);

  const filtered = useMemo(() => {
    return visitors.filter((row) => {
      if (filter === "online") return enLinea(row);
      if (filter === "gps") return row.locationStatus === "granted";
      if (filter === "camera") return row.cameraStatus === "granted";
      if (filter === "mic") return row.microphoneStatus === "granted";
      return true;
    });
  }, [visitors, filter]);

  const cards = [
    ["Usuarios", stats?.usuarios],
    ["Visitas", stats?.visitas],
    ["Cámara", stats?.camara],
    ["Micrófono", stats?.microfono],
    ["Ubicación", stats?.ubicacion],
    ["Cookies", stats?.cookies],
  ];

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "online", label: "En línea" },
    { id: "gps", label: "Geolocalización" },
    { id: "camera", label: "Cámara" },
    { id: "mic", label: "Micrófono" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Administrador</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Usuarios del laboratorio</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            Entra a cada cuenta para ver info, GPS, permisos y su bitácora.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("zt_admin");
            router.push("/admin/login");
          }}
          className="self-start text-sm text-[var(--muted)]"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3 sm:p-4">
            <p className="text-[11px] text-[var(--muted)] sm:text-xs">{label}</p>
            <p className="mt-1 font-serif text-2xl sm:text-3xl">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm ${
                filter === item.id ? "bg-[var(--gold)] font-semibold text-black" : "border border-white/10 text-[var(--muted)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar correo o IP"
            className="w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm"
          />
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm sm:w-auto"
          >
            <option value="">Todos los aparatos</option>
            <option value="desktop">Computadora</option>
            <option value="mobile">Celular</option>
            <option value="tablet">Tablet</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          Nadie en esta categoría. Cuando alguien entre, aparecerá aquí.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => (
            <VisitorCard key={row.visitorId} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
