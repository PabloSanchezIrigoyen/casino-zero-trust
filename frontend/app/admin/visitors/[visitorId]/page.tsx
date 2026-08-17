"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { CategoryTabs } from "@/components/admin/CategoryTabs";
import { FichaTecnica } from "@/components/admin/FichaTecnica";
import { GpsPanel } from "@/components/admin/GpsPanel";
import { dispositivo, enLinea, estadoAlmacenamiento, estadoCookie, estadoPermiso, nombrePermiso } from "@/lib/labels";
import { deviceIpCaption } from "@/lib/deviceIdentity";
import { isEmptyValue } from "@/lib/visible";
import type { LabEvent, PermissionLog, Visit, Visitor } from "@/lib/types";

type Detail = Visitor & { visits: Visit[]; events: LabEvent[]; permissions: PermissionLog[] };

const TABS = [
  { id: "info", label: "Info" },
  { id: "geo", label: "Geolocalización" },
  { id: "permisos", label: "Permisos" },
  { id: "dispositivos", label: "Dispositivos" },
  { id: "bitacora", label: "Bitácora" },
  { id: "ficha", label: "Ficha" },
];

export default function VisitorDetailPage() {
  const params = useParams<{ visitorId: string }>();
  const router = useRouter();
  const [visitor, setVisitor] = useState<Detail | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState("info");
  const visitorId = Array.isArray(params.visitorId) ? params.visitorId[0] : params.visitorId;

  useEffect(() => {
    const token = sessionStorage.getItem("zt_admin");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    if (!visitorId) return;

    const load = async () => {
      try {
        const res = (await api.adminVisitor(token, visitorId)) as { visitor: Detail };
        setVisitor(res.visitor);
        setMissing(false);
      } catch {
        setVisitor(null);
        setMissing(true);
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
  }, [visitorId, router]);

  if (missing) {
    return (
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6">
        <h1 className="font-serif text-3xl">Este usuario ya no está</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Se borró o nunca llegó a crear cuenta. El panel solo muestra sesiones reales.
        </p>
        <Link href="/admin" className="mt-5 inline-block text-[var(--gold)]">
          Volver al panel
        </Link>
      </div>
    );
  }

  if (!visitor) return <p>Cargando usuario…</p>;

  const perms = [
    ["Cookies", estadoCookie(visitor.cookieConsent, visitor.cookieConsentAt)],
    ["Almacenamiento", estadoAlmacenamiento(visitor)],
    ["Cámara", visitor.cameraStatus],
    ["Micrófono", visitor.microphoneStatus],
    ["Ubicación", visitor.locationStatus],
    ["Notificaciones", visitor.notificationStatus],
  ];
  const ipPublica = visitor.publicIpv4 || visitor.publicIp;
  const idiomaZona = [visitor.language, visitor.timezone].filter(Boolean).join(" · ");
  const dispositivosVistos = Array.from(
    new Map(
      visitor.visits
        .filter((visit) => visit.deviceIp || visit.deviceId)
        .map((visit) => [visit.deviceId || visit.deviceIp || visit.id, visit]),
    ).values(),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-sm text-[var(--gold)]">
          ← Usuarios
        </Link>
        <button
          type="button"
          onClick={async () => {
            const token = sessionStorage.getItem("zt_admin") || "";
            await api.adminDelete(token, visitor.visitorId);
            router.push("/admin");
          }}
          className="rounded-xl border border-red-400/40 px-3 py-1.5 text-sm text-red-300"
        >
          Borrar usuario
        </button>
      </div>

      <header className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--gold)]">Ficha de usuario</p>
        <h1 className="mt-1 break-all font-serif text-2xl sm:text-4xl">{visitor.email}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          <span className={enLinea(visitor) ? "text-emerald-300" : ""}>
            {enLinea(visitor) ? "En línea" : "Fuera"}
          </span>
          {" · "}
          {dispositivo(visitor.deviceType)}
          {" · "}
          {visitor.visitCount} visitas
        </p>
      </header>

      <CategoryTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "info" ? (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl">Información</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="Dispositivo" value={`${dispositivo(visitor.deviceType)}${visitor.deviceOs ? ` · ${visitor.deviceOs}` : ""}`} />
            <Info label="Navegador" value={visitor.browser} />
            <Info label="IP de este dispositivo" value={visitor.deviceIp} />
            <Info label="Tipo de IP" value={visitor.deviceIp ? deviceIpCaption(visitor.deviceIpKind) : null} />
            <Info label="IP pública (proveedor)" value={ipPublica} />
            <Info label="Pantalla" value={visitor.screenWidth ? `${visitor.screenWidth}×${visitor.screenHeight}` : null} />
            <Info label="Idioma / zona" value={idiomaZona} />
            <Info
              label="Primera / última visita"
              value={`${new Date(visitor.firstSeenAt).toLocaleString("es-MX")} / ${new Date(visitor.lastSeenAt).toLocaleString("es-MX")}`}
            />
          </div>
          <section>
            <h3 className="mt-4 text-xs uppercase tracking-wide text-[var(--gold)]">Sesiones</h3>
            <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
              {visitor.visits.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Sin sesiones todavía.</p>
              ) : (
                visitor.visits.map((visit) => (
                  <p key={visit.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-[var(--muted)]">
                    {new Date(visit.startedAt).toLocaleString("es-MX")} · {dispositivo(visit.deviceType)}
                    {visit.deviceIp ? ` · ${visit.deviceIp}` : ""}
                    {visit.publicIp || visit.ip ? ` · proveedor ${visit.publicIp || visit.ip}` : ""}
                  </p>
                ))
              )}
            </div>
          </section>
        </section>
      ) : null}

      {tab === "geo" ? <GpsPanel visitor={visitor} /> : null}

      {tab === "permisos" ? (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl">Permisos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {perms.map(([label, state]) => (
              <div key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3 sm:p-4">
                <p className="text-xs text-[var(--muted)]">{label}</p>
                <p className="mt-1 text-sm font-semibold sm:text-base">{estadoPermiso(state)}</p>
              </div>
            ))}
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {visitor.permissions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Todavía no ha respondido ningún permiso.</p>
            ) : (
              visitor.permissions.map((item) => (
                <p key={item.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm">
                  <span className="text-[var(--gold)]">
                    {nombrePermiso(item.permission)} · {estadoPermiso(item.status)}
                  </span>
                  {item.context ? <span className="mt-1 block text-[var(--muted)]">{item.context}</span> : null}
                </p>
              ))
            )}
          </div>
        </section>
      ) : null}

      {tab === "dispositivos" ? (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl">Dispositivos</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="ID FingerprintJS" value={visitor.deviceId} />
            <Info label="Hash canvas + WebGL + UA" value={visitor.fingerprintHash} />
            <Info label="Algoritmo" value={visitor.fingerprintAlgo} />
            <Info label="IP de este dispositivo" value={visitor.deviceIp} />
          </div>
          {dispositivosVistos.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Aún no hay huella de otro aparato en esta cuenta.</p>
          ) : (
            dispositivosVistos.map((item) => (
              <div key={item.deviceId || item.id} className="rounded-xl border border-white/10 px-3 py-3">
                <p className="font-mono text-sm break-all text-[var(--gold-2)]">{item.deviceId || item.deviceIp}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {dispositivo(item.deviceType)}
                  {item.deviceIp ? ` · ${item.deviceIp}` : ""}
                </p>
              </div>
            ))
          )}
        </section>
      ) : null}

      {tab === "bitacora" ? (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl">Bitácora de este usuario</h2>
          <p className="text-sm text-[var(--muted)]">Solo la actividad de {visitor.email}. No es el log general del casino.</p>
          <div className="max-h-[28rem] space-y-2 overflow-y-auto">
            {visitor.events.length === 0 ? (
              <p className="rounded-xl border border-white/10 px-3 py-6 text-center text-sm text-[var(--muted)]">
                Este usuario todavía no tiene eventos.
              </p>
            ) : (
              visitor.events.map((event) => (
                <p key={event.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-[var(--muted)]">
                  <span className="text-[var(--gold)]">{new Date(event.createdAt).toLocaleString("es-MX")}</span>
                  <span className="mt-1 block">{event.message}</span>
                </p>
              ))
            )}
          </div>
        </section>
      ) : null}

      {tab === "ficha" ? <FichaTecnica visitor={visitor} /> : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  if (isEmptyValue(value)) return null;
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 break-all text-sm">{value}</p>
    </div>
  );
}
