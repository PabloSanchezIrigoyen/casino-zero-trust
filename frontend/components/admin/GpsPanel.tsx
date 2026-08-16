import type { Visitor } from "@/lib/types";
import { formatAccuracy, locationKind } from "@/lib/permissions";

export function GpsPanel({ visitor }: { visitor: Visitor }) {
  if (visitor.locationStatus !== "granted" || visitor.locationLat == null || visitor.locationLng == null) {
    return null;
  }

  const maps = `https://www.google.com/maps?q=${visitor.locationLat},${visitor.locationLng}`;
  const kind = locationKind(visitor.locationAccuracy);

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl sm:text-3xl">Coordenadas</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Latitud</p>
          <p className="mt-1 break-all font-mono text-sm">{visitor.locationLat}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Longitud</p>
          <p className="mt-1 break-all font-mono text-sm">{visitor.locationLng}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Precisión</p>
          <p className="mt-1 text-sm">{formatAccuracy(visitor.locationAccuracy)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Tipo</p>
          <p className="mt-1 text-sm">{kind}</p>
        </div>
      </div>
      <a href={maps} target="_blank" rel="noreferrer" className="inline-block text-sm text-[var(--gold)]">
        Abrir en el mapa
      </a>
      {visitor.locationAccuracy != null && visitor.locationAccuracy > 1000 ? (
        <p className="text-xs text-[var(--muted)]">
          Una laptop no tiene GPS. El navegador estima con Wi‑Fi/IP y el error puede ser de cientos de
          kilómetros. En un celular con ubicación precisa suelen salir metros.
        </p>
      ) : null}
    </section>
  );
}
