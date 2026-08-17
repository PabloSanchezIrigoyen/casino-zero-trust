const DEVICE_KEY = "zt_device_id";

export type DeviceIpKind = "wifi" | "lab";

export function getOrCreateDeviceId() {
  const make = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}`);
  try {
    const stored = localStorage.getItem(DEVICE_KEY) || sessionStorage.getItem(DEVICE_KEY);
    if (stored) {
      sessionStorage.setItem(DEVICE_KEY, stored);
      try {
        localStorage.setItem(DEVICE_KEY, stored);
      } catch {
        // Sin localStorage: esta pestaña sigue identificando el aparato.
      }
      return stored;
    }
    const id = make();
    sessionStorage.setItem(DEVICE_KEY, id);
    try {
      localStorage.setItem(DEVICE_KEY, id);
    } catch {
      // igual
    }
    return id;
  } catch {
    return make();
  }
}

function uniqueLabIp(deviceId: string) {
  const hex = deviceId.replace(/-/g, "").padEnd(8, "0");
  const a = (parseInt(hex.slice(0, 2), 16) % 254) + 1;
  const b = parseInt(hex.slice(2, 4), 16);
  const c = (parseInt(hex.slice(4, 6), 16) % 254) + 1;
  return `10.${a}.${b}.${c}`;
}

export function isPrivateIpv4(ip: string) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function pickWifiIpv4(ips: string[] | undefined) {
  const list = (ips || []).map((item) => item.split("%")[0].trim()).filter(Boolean);
  const v4 = list.filter((ip) => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && isPrivateIpv4(ip) && !ip.startsWith("169.254."));
  return (
    v4.find((ip) => ip.startsWith("192.168.")) ||
    v4.find((ip) => ip.startsWith("10.")) ||
    v4.find((ip) => isPrivateIpv4(ip)) ||
    ""
  );
}

export function resolveDeviceIp(localIps: string[] | undefined, deviceId: string): { deviceIp: string; deviceIpKind: DeviceIpKind } {
  const wifi = pickWifiIpv4(localIps);
  if (wifi) return { deviceIp: wifi, deviceIpKind: "wifi" };
  return { deviceIp: uniqueLabIp(deviceId), deviceIpKind: "lab" };
}

export function deviceIpCaption(kind?: string | null) {
  if (kind === "wifi") return "IP de este dispositivo en la Wi‑Fi (no es la del proveedor)";
  return "IP única de este dispositivo / navegador";
}
