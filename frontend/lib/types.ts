export type PermissionState = "prompt" | "granted" | "denied";

export type Visitor = {
  id: string;
  visitorId: string;
  email: string;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
  lastIp: string | null;
  publicIp: string | null;
  lastUserAgent: string | null;
  deviceType: string | null;
  deviceOs: string | null;
  browser: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  language: string | null;
  timezone: string | null;
  cookieConsent: boolean;
  cookieConsentAt: string | null;
  localStorageOk: boolean;
  cameraStatus: PermissionState;
  microphoneStatus: PermissionState;
  locationStatus: PermissionState;
  notificationStatus: PermissionState;
  locationLat: number | null;
  locationLng: number | null;
  locationAccuracy: number | null;
  publicIpv4?: string | null;
  publicIpv6?: string | null;
  localIps?: string | null;
  deviceId?: string | null;
  deviceIp?: string | null;
  deviceIpKind?: string | null;
  fingerprintHash?: string | null;
  fingerprintAlgo?: string | null;
  gpuVendor?: string | null;
  gpuRenderer?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  architecture?: string | null;
  cpuCores?: number | null;
  deviceMemoryGb?: number | null;
  browserVersion?: string | null;
  connectionType?: string | null;
  techProfile?: Record<string, unknown> | null;
  enLinea?: boolean;
};

export type Visit = {
  id: string;
  startedAt: string;
  lastBeatAt: string;
  endedAt: string | null;
  ip: string | null;
  publicIp: string | null;
  deviceType: string | null;
  path: string | null;
  localIps?: string | null;
  deviceId?: string | null;
  deviceIp?: string | null;
  deviceIpKind?: string | null;
  fingerprintHash?: string | null;
  fingerprintAlgo?: string | null;
};

export type LabEvent = {
  id: string;
  type: string;
  message: string;
  payload?: unknown;
  createdAt: string;
  visitor?: { email: string | null; visitorId: string; deviceType: string | null };
};

export type PermissionLog = {
  id: string;
  permission: string;
  status: string;
  context: string;
  createdAt: string;
};

export type Toast = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "ok" | "warn" | "danger";
};
