"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { FichaTecnica } from "@/components/admin/FichaTecnica";
import { dispositivo, estadoCookie, estadoPermiso, nombrePermiso } from "@/lib/labels";
import { formatAccuracy } from "@/lib/permissions";
import { isEmptyValue } from "@/lib/visible";
import type { LabEvent, PermissionLog, Visit, Visitor } from "@/lib/types";

type Detail = Visitor & { visits: Visit[]; events: LabEvent[]; permissions: PermissionLog[] };

export default function VisitorDetailPage() {
  const params = useParams<{ visitorId: string }>();
  const router = useRouter();
  const [visitor, setVisitor] = useState<Detail | null>(null);
  const [missing, setMissing] = useState(false);
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
    ["Almacenamiento", visitor.localStorageOk ? "granted" : "prompt"],
    ["Cámara", visitor.cameraStatus],
    ["Micrófono", visitor.microphoneStatus],
    ["Ubicación", visitor.locationStatus],
    ["Notificaciones", visitor.notificationStatus],
  ];
  const ipPublica = visitor.publicIpv4 || visitor.publicIp;
  const idiomaZona = [visitor.language, visitor.timezone].filter(Boolean).join(" · ");

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-[var(--gold)]">
        ← Volver
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-all font-serif text-3xl sm:text-4xl md:text-5xl">{visitor.email}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {dispositivo(visitor.deviceType)} · {visitor.visitCount} visitas
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            const token = sessionStorage.getItem("zt_admin") || "";
            await api.adminDelete(token, visitor.visitorId);
            router.push("/admin");
          }}
          className="self-start rounded-xl border border-red-400/40 px-4 py-2 text-sm text-red-300"
        >
          Borrar usuario
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Info label="Dispositivo" value={`${dispositivo(visitor.deviceType)}${visitor.deviceOs ? ` · ${visitor.deviceOs}` : ""}`} />
        <Info label="Navegador" value={visitor.browser} />
        <Info label="IP pública" value={ipPublica} />
        <Info label="Pantalla" value={visitor.screenWidth ? `${visitor.screenWidth}×${visitor.screenHeight}` : null} />
        <Info label="Idioma / zona" value={idiomaZona} />
        <Info
          label="Primera / última visita"
          value={`${new Date(visitor.firstSeenAt).toLocaleString("es-MX")} / ${new Date(visitor.lastSeenAt).toLocaleString("es-MX")}`}
        />
      </div>
      <p className="text-xs text-[var(--muted)]">
        La IP pública es la del proveedor. Un lookup puede mostrar otra ciudad (por ejemplo Chihuahua) porque así
        está registrado el bloque, no porque use GPS.
      </p>
      <FichaTecnica visitor={visitor} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {perms.map(([label, state]) => (
          <div key={label} className="rounded-2xl border border-[var(--line)] p-3 sm:p-4">
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-sm font-semibold sm:text-base">{estadoPermiso(state)}</p>
          </div>
        ))}
      </div>
      {visitor.locationStatus === "granted" && visitor.locationLat != null ? (
        <p className="text-sm text-emerald-300">
          GPS: {visitor.locationLat}, {visitor.locationLng} ({formatAccuracy(visitor.locationAccuracy)})
        </p>
      ) : null}
      <section>
        <h2 className="font-serif text-2xl sm:text-3xl">Visitas</h2>
        <div className="mt-3 space-y-2">
          {visitor.visits.map((visit) => (
            <p key={visit.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-[var(--muted)]">
              {new Date(visit.startedAt).toLocaleString("es-MX")} · {dispositivo(visit.deviceType)}
              {visit.publicIp || visit.ip ? ` · ${visit.publicIp || visit.ip}` : ""}
            </p>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-serif text-2xl sm:text-3xl">Permisos</h2>
        <div className="mt-3 space-y-2">
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
      <section>
        <h2 className="font-serif text-2xl sm:text-3xl">Bitácora</h2>
        <div className="mt-3 space-y-2">
          {visitor.events.map((event) => (
            <p key={event.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-[var(--muted)]">
              {new Date(event.createdAt).toLocaleString("es-MX")}: {event.message}
            </p>
          ))}
        </div>
      </section>
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
