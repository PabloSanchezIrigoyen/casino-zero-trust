"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLab } from "@/context/LabSession";
import { dispositivo, estadoPermiso, nombrePermiso } from "@/lib/labels";

type Awareness = {
  grantedCount: number;
  granted: string[];
  technical: Record<string, string | number | null>;
  visitor: { permissions: { id: string; permission: string; status: string; context: string; createdAt: string }[] };
};

export default function AwarenessPage() {
  const { loggedIn, visitor } = useLab();
  const [data, setData] = useState<Awareness | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    void api.awareness().then((res) => setData(res as Awareness)).catch(() => undefined);
  }, [loggedIn, visitor?.lastSeenAt]);

  return (
    <div className="rounded-3xl border border-[var(--line)] bg-white px-6 py-8 text-[#10203a] md:px-10">
      <p className="inline-block rounded bg-[#c23b3b] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        Mensaje final de concientización
      </p>
      <h1 className="mt-4 font-serif text-4xl leading-tight">
        Durante esta experiencia autorizaste acceso a{" "}
        <span className="text-[#c23b3b]">{data?.grantedCount ?? 0} recursos</span> de tu dispositivo.
      </h1>
      <ul className="mt-6 space-y-3 text-sm leading-6">
        <li className="flex gap-3">
          <span className="mt-2 h-2 w-2 rounded-full bg-[#c23b3b]" />
          <span>
            <strong>Qué permisos concediste voluntariamente:</strong>{" "}
            {data?.granted.length ? data.granted.join(", ") : "aún ninguno."}
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-2 w-2 rounded-full bg-[#c23b3b]" />
          <span>
            <strong>Qué información técnica puede observar una aplicación WEB:</strong> correo{" "}
            {data?.technical.email}, IP {data?.technical.publicIp || data?.technical.ip}, dispositivo{" "}
            {dispositivo(String(data?.technical.deviceType || ""))}, {data?.technical.browser},{" "}
            {data?.technical.screen}, idioma {data?.technical.language}, zona {data?.technical.timezone}.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-2 w-2 rounded-full bg-[#c23b3b]" />
          <span>
            <strong>Qué riesgos existen al aceptar sin leer:</strong> un sitio real podría grabar, geolocalizar
            o perfilarte. Aquí no lo hacemos; solo documentamos el consentimiento.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-2 w-2 rounded-full bg-[#c23b3b]" />
          <span>
            <strong>Buenas prácticas:</strong> lee el motivo, usa permisos temporales, revisa el candado del
            navegador y revoca lo que ya no necesites.
          </span>
        </li>
      </ul>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {(data?.visitor.permissions || []).slice(0, 8).map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
            <p className="font-semibold">
              {nombrePermiso(item.permission)} · {estadoPermiso(item.status)}
            </p>
            <p className="mt-1 text-slate-600">{item.context}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
