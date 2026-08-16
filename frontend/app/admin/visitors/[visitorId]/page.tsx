"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { FichaTecnica } from "@/components/admin/FichaTecnica";
import { dispositivo, estadoCookie, estadoPermiso, nombrePermiso } from "@/lib/labels";
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
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6">
        <h1 className="font-serif text-3xl">Este usuario ya no está</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Se borró o nunca llegó a crear cuenta con correo y contraseña. El panel solo muestra
          sesiones reales.
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
    ["Almacenamiento local", visitor.localStorageOk ? "granted" : "prompt"],
    ["Cámara", visitor.cameraStatus],
    ["Micrófono", visitor.microphoneStatus],
    ["Ubicación", visitor.locationStatus],
    ["Notificaciones", visitor.notificationStatus],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-[var(--gold)]">
        ← Volver al panel
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl">{visitor.email}</h1>
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
          className="rounded-xl border border-red-400/40 px-4 py-2 text-sm text-red-300"
        >
          Borrar este usuario
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Info label="Dispositivo" value={`${dispositivo(visitor.deviceType)} · ${visitor.deviceOs || "—"}`} />
        <Info label="Navegador" value={visitor.browser || "—"} />
        <Info label="IP pública (proveedor)" value={visitor.publicIp || "—"} />
        <Info label="IP de red" value={visitor.lastIp || "—"} />
        <p className="md:col-span-3 text-xs text-[var(--muted)]">
          La IP pública es la de tu proveedor de internet. Sitios como “what is my IP” pueden decir Chihuahua
          u otra ciudad porque así está registrado el bloque, no porque el laboratorio use GPS.
        </p>
        <Info label="Pantalla" value={`${visitor.screenWidth}×${visitor.screenHeight}`} />
        <Info label="Idioma / zona" value={`${visitor.language} · ${visitor.timezone}`} />
        <Info
          label="Primera / última visita"
          value={`${new Date(visitor.firstSeenAt).toLocaleString("es-MX")} / ${new Date(visitor.lastSeenAt).toLocaleString("es-MX")}`}
        />
      </div>
      <FichaTecnica visitor={visitor} />
      <div className="grid gap-3 md:grid-cols-3">
        {perms.map(([label, state]) => (
          <div key={label} className="rounded-2xl border border-[var(--line)] p-4">
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-1 font-semibold">{estadoPermiso(state)}</p>
          </div>
        ))}
      </div>
      {visitor.locationStatus === "granted" ? (
        <p className="text-sm text-emerald-300">
          Ubicación aproximada: {visitor.locationLat}, {visitor.locationLng} (±{visitor.locationAccuracy} m)
        </p>
      ) : null}
      <section>
        <h2 className="font-serif text-3xl">Historial de visitas</h2>
        <div className="mt-3 space-y-2">
          {visitor.visits.map((visit) => (
            <p key={visit.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-[var(--muted)]">
              {new Date(visit.startedAt).toLocaleString("es-MX")} · {dispositivo(visit.deviceType)} ·{" "}
              {visit.publicIp || visit.ip} · {visit.path}
            </p>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-serif text-3xl">Permisos que aceptó o negó</h2>
        <div className="mt-3 space-y-2">
          {visitor.permissions.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Todavía no ha respondido ningún permiso.</p>
          ) : (
            visitor.permissions.map((item) => (
              <p key={item.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm">
                <span className="text-[var(--gold)]">
                  {nombrePermiso(item.permission)} · {estadoPermiso(item.status)}
                </span>{" "}
                <span className="text-[var(--muted)]">{item.context}</span>
              </p>
            ))
          )}
        </div>
      </section>
      <section>
        <h2 className="font-serif text-3xl">Bitácora</h2>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
