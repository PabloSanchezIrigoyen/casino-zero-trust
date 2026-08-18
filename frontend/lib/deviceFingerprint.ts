const DEVICE_KEY = "zt_device_id";
const HASH_KEY = "zt_fingerprint_hash";

export type DeviceFingerprint = {
  deviceId: string;
  fingerprintHash: string;
  fingerprintAlgo: string;
  signals: Record<string, string>;
};

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canvasSignal() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "sin-canvas";
    ctx.textBaseline = "top";
    ctx.font = "18px 'Segoe UI', Arial";
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(8, 8, 140, 48);
    ctx.fillStyle = "#1a1814";
    ctx.fillText("Casino Zero Trust ⌖", 12, 22);
    ctx.fillStyle = "rgba(194, 59, 59, 0.65)";
    ctx.fillText("huella canvas", 14, 52);
    ctx.beginPath();
    ctx.arc(250, 40, 28, 0, Math.PI * 2);
    ctx.strokeStyle = "#7ec8e3";
    ctx.stroke();
    return canvas.toDataURL();
  } catch {
    return "canvas-bloqueado";
  }
}

function webglSignal() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return "sin-webgl";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR));
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
    return `${vendor} | ${renderer}`;
  } catch {
    return "webgl-bloqueado";
  }
}

function customSignals() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: [...navigator.languages].join(","),
    platform: navigator.platform,
    hardwareConcurrency: String(navigator.hardwareConcurrency || ""),
    deviceMemory: String((navigator as Navigator & { deviceMemory?: number }).deviceMemory || ""),
    maxTouchPoints: String(navigator.maxTouchPoints || 0),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}@${window.devicePixelRatio}`,
    canvas: canvasSignal(),
    webgl: webglSignal(),
  };
}

async function fingerprintJsId() {
  try {
    const { load } = await import("@fingerprintjs/fingerprintjs");
    const fp = await load();
    const result = await fp.get();
    return result.visitorId || "";
  } catch {
    return "";
  }
}

function persist(deviceId: string, hash: string) {
  try {
    sessionStorage.setItem(DEVICE_KEY, deviceId);
    sessionStorage.setItem(HASH_KEY, hash);
    localStorage.setItem(DEVICE_KEY, deviceId);
    localStorage.setItem(HASH_KEY, hash);
  } catch {
    // El ID igual se envía al servidor en el heartbeat.
  }
}

let cachedDevice: DeviceFingerprint | null = null;

export async function collectPersistentDevice(): Promise<DeviceFingerprint> {
  if (cachedDevice) return cachedDevice;
  const signals = customSignals();
  const fingerprintHash = await sha256(
    [signals.canvas, signals.webgl, signals.userAgent, signals.screen, signals.timezone, signals.hardwareConcurrency].join("|"),
  );
  const fpjsId = await fingerprintJsId();
  const stored = (() => {
    try {
      return localStorage.getItem(DEVICE_KEY) || sessionStorage.getItem(DEVICE_KEY) || "";
    } catch {
      return "";
    }
  })();

  const deviceId = fpjsId || stored || fingerprintHash.slice(0, 32);
  persist(deviceId, fingerprintHash);

  cachedDevice = {
    deviceId,
    fingerprintHash,
    fingerprintAlgo: fpjsId ? "fingerprintjs+canvas-webgl-ua" : "canvas-webgl-ua",
    signals: {
      ...signals,
      canvas: signals.canvas.startsWith("data:") ? `canvas:${signals.canvas.length}c` : signals.canvas,
    },
  };
  return cachedDevice;
}
