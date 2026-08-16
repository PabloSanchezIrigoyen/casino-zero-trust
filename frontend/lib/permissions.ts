import type { PermissionState } from "./types";

type QueryName = "camera" | "microphone" | "geolocation" | "notifications";

async function query(name: QueryName): Promise<PermissionState> {
  try {
    const status = await navigator.permissions.query({ name } as PermissionDescriptor);
    return status.state as PermissionState;
  } catch {
    if (name === "notifications" && "Notification" in window) {
      return Notification.permission as PermissionState;
    }
    return "prompt";
  }
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

export function formatAccuracy(meters: number | null | undefined) {
  if (meters == null || Number.isNaN(meters)) return "sin dato";
  if (meters >= 1000) {
    return `±${(meters / 1000).toFixed(1)} km (aproximada, típica sin GPS preciso)`;
  }
  return `±${Math.round(meters)} m (GPS del teléfono)`;
}
