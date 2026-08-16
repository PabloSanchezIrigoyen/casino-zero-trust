import type { Visitor } from "@/lib/types";
import { mapsEmbedUrl, mapsUrl } from "@/lib/maps";
import { formatAccuracy, locationKind } from "@/lib/permissions";

export function GpsPanel({ visitor }: { visitor: Visitor }) {
  if (visitor.locationStatus !== "granted" || visitor.locationLat == null || visitor.locationLng == null) {
    return null;
  }

  const lat = visitor.locationLat;
  const lng = visitor.locationLng;
  const kind = locationKind(visitor.locationAccuracy);

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl sm:text-3xl">Coordenadas</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Latitud</p>
          <p className="mt-1 break-all font-mono text-sm">{lat}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Longitud</p>
          <p className="mt-1 break-all font-mono text-sm">{lng}</p>
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
      <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
        <iframe
          title="Google Maps"
          src={mapsEmbedUrl(lat, lng)}
          className="h-64 w-full sm:h-80"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={mapsUrl(lat, lng)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-xl bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-black"
      >
        Abrir en Google Maps
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
