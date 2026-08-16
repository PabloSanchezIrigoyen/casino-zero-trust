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
  return Math.round(value * 1000) / 1000;
}
