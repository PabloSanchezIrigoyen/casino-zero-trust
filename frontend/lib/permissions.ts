import type { PermissionState } from "./types";

type QueryName = "camera" | "microphone" | "geolocation" | "notifications";

function notificationState(): PermissionState {
  if (!("Notification" in window)) return "prompt";
  const permission = Notification.permission;
  if (permission === "granted") return "granted";
  if (permission === "denied") return "denied";
  return "prompt";
}

async function query(name: QueryName): Promise<PermissionState> {
  if (name === "notifications") return notificationState();
  try {
    const status = await navigator.permissions.query({ name } as PermissionDescriptor);
    return status.state as PermissionState;
  } catch {
    return "prompt";
  }
}

export function askNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return Promise.resolve("denied");
  return new Promise((resolve) => {
    const outcome = Notification.requestPermission(resolve);
    if (outcome && typeof outcome.then === "function") {
      void outcome.then(resolve);
    }
  });
}

export async function readBrowserPermissions() {
  const [cameraStatus, microphoneStatus, locationStatus, notificationStatus] = await Promise.all([
    query("camera"),
    query("microphone"),
    query("geolocation"),
    query("notifications"),
  ]);
  return { cameraStatus, microphoneStatus, locationStatus, notificationStatus };
}

export function roundCoord(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function locationKind(meters: number | null | undefined) {
  if (meters == null || Number.isNaN(meters)) return "Sin dato";
  if (meters <= 50) return "GPS preciso";
  if (meters <= 500) return "GPS aproximado";
  return "Red / Wi‑Fi (la PC no tiene GPS)";
}

export function formatAccuracy(meters: number | null | undefined) {
  if (meters == null || Number.isNaN(meters)) return "sin dato";
  if (meters >= 1000) {
    return `±${(meters / 1000).toFixed(1)} km`;
  }
  return `±${Math.round(meters)} m`;
}
