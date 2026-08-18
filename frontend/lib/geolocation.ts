"use client";

export type SavedLocation = {
  ok: boolean;
  saved: boolean;
  visitor?: unknown;
  error?: string;
};

export function geoErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = Number((error as { code: number }).code);
    if (code === 1) return "Denegaste el permiso de ubicación en el navegador.";
    if (code === 2) return "El GPS no está disponible ahora. Activa ubicación precisa e inténtalo de nuevo.";
    if (code === 3) return "Se agotó el tiempo esperando el GPS. Inténtalo otra vez cerca de una ventana.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo obtener la ubicación.";
}

export function capturePrecisePosition(): Promise<GeolocationPosition> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.reject(new Error("Este navegador no soporta navigator.geolocation."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 15000,
    });
  });
}

export async function saveLocationToApi(payload: {
  status: "granted" | "denied";
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  token: string;
  visitorId: string;
}): Promise<SavedLocation> {
  const res = await fetch("/api/save-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${payload.token}`,
      "X-Visitor-Id": payload.visitorId,
    },
    body: JSON.stringify({
      status: payload.status,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as SavedLocation;
  if (!res.ok) throw new Error(data.error || "No se pudo guardar la ubicación");
  return data;
}
