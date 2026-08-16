"use client";

import { useLab } from "@/context/LabSession";
import { estadoPermiso } from "@/lib/labels";

function Chip({ label, state }: { label: string; state: string }) {
  const color =
    state === "granted" || state === "true"
      ? "border-emerald-500/40 text-emerald-300"
      : state === "denied" || state === "false"
        ? "border-red-500/40 text-red-300"
        : "border-white/10 text-[var(--muted)]";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] tracking-wide ${color}`}>
      {label}: {estadoPermiso(state)}
    </span>
  );
}

export function PermissionHud() {
  const { visitor } = useLab();
  if (!visitor) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Chip label="Cámara" state={visitor.cameraStatus} />
      <Chip label="Micrófono" state={visitor.microphoneStatus} />
      <Chip label="Ubicación" state={visitor.locationStatus} />
      <Chip label="Avisos" state={visitor.notificationStatus} />
      <Chip label="Cookies" state={visitor.cookieConsent ? "granted" : visitor.cookieConsentAt ? "denied" : "prompt"} />
      <Chip label="Almacenamiento" state={visitor.localStorageOk ? "granted" : "prompt"} />
    </div>
  );
}
