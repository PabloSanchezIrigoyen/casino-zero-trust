"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { dispositivo, enLinea, estadoCookie, estadoPermiso } from "@/lib/labels";
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
    state === "granted"
      ? "text-emerald-300"
      : state === "denied"
        ? "text-red-300"
        : "text-[var(--muted)]";
  return (
    <span className={color}>
      {label}: {estadoPermiso(String(state))}
    </span>
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
    ["Usuarios registrados", stats?.usuarios],
    ["Visitas reales", stats?.visitas],
    ["Cámara aceptada", stats?.camara],
    ["Micrófono aceptado", stats?.microfono],
    ["Ubicación aceptada", stats?.ubicacion],
    ["Cookies aceptadas", stats?.cookies],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">Panel de administrador</p>
          <h1 className="font-serif text-4xl md:text-5xl">Quién entró al casino</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            Solo aparecen cuentas con correo y contraseña. Los datos se actualizan solos cada pocos
            segundos: dispositivo, IP y permisos reales del navegador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("zt_admin");
            router.push("/admin/login");
          }}
          className="text-sm text-[var(--muted)]"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-1 font-serif text-3xl">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por correo o IP"
          className="min-w-[240px] flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
        />
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
        >
          <option value="">Todos los dispositivos</option>
          <option value="desktop">Computadora</option>
          <option value="mobile">Celular</option>
          <option value="tablet">Tablet</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-[var(--line)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-xs text-[var(--muted)]">
            <tr>
              <th className="px-3 py-3">Correo</th>
              <th className="px-3 py-3">Entró desde</th>
              <th className="px-3 py-3">IP pública</th>
              <th className="px-3 py-3">Equipo</th>
              <th className="px-3 py-3">Permisos</th>
              <th className="px-3 py-3">Visitas</th>
              <th className="px-3 py-3">Última vez</th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[var(--muted)]">
                  Aún no hay usuarios registrados. Cuando alguien cree una cuenta en el casino, aparecerá aquí.
                </td>
              </tr>
            ) : (
              visitors.map((row) => (
                <tr key={row.visitorId} className="border-t border-white/5">
                  <td className="px-3 py-3">
                    <Link href={`/admin/visitors/${row.visitorId}`} className="text-[var(--gold)]">
                      {row.email}
                    </Link>
                    {enLinea(row) ? (
                      <span className="ml-2 text-[11px] text-emerald-300">en línea</span>
                    ) : (
                      <span className="ml-2 text-[11px] text-[var(--muted)]">fuera</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {dispositivo(row.deviceType)}
                    <div className="text-xs text-[var(--muted)]">{row.browser}</div>
                  </td>
                  <td className="px-3 py-3">
                    {row.publicIpv4 || row.publicIp || row.lastIp || "—"}
                    {row.publicIpv6 ? <div className="text-[11px] text-[var(--muted)]">{row.publicIpv6}</div> : null}
                    {row.localIps ? <div className="text-[11px] text-[var(--muted)]">local: {row.localIps}</div> : null}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {row.deviceModel || row.gpuRenderer || "Sin modelo expuesto"}
                    <div className="text-[var(--muted)]">{row.cpuCores ? `${row.cpuCores} núcleos` : ""} {row.deviceMemoryGb ? `· ${row.deviceMemoryGb} GB` : ""}</div>
                  </td>
                  <td className="px-3 py-3 text-xs leading-5">
                    <div>
                      <Permiso label="Cámara" ok={row.cameraStatus} />
                    </div>
                    <div>
                      <Permiso label="Micrófono" ok={row.microphoneStatus} />
                    </div>
                    <div>
                      <Permiso label="Ubicación" ok={row.locationStatus} />
                    </div>
                    <div>
                      <Permiso label="Cookies" ok={estadoCookie(row.cookieConsent, row.cookieConsentAt)} />
                    </div>
                  </td>
                  <td className="px-3 py-3">{row.visitCount}</td>
                  <td className="px-3 py-3 text-xs text-[var(--muted)]">
                    {new Date(row.lastSeenAt).toLocaleString("es-MX")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="font-serif text-3xl">Actividad reciente</h2>
        <div className="mt-3 space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Cuando un usuario entre o acepte un permiso, se verá aquí.</p>
          ) : (
            events.slice(0, 12).map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 px-4 py-3 text-sm">
                <p className="text-[11px] text-[var(--gold)]">
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
