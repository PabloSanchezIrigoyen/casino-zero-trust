export type TechProfile = {
  capturadoEn: string;
  navegador: Record<string, unknown>;
  sistema: Record<string, unknown>;
  maquina: Record<string, unknown>;
  pantalla: Record<string, unknown>;
  red: Record<string, unknown>;
  gpu: Record<string, unknown>;
  medios: Record<string, unknown>;
  limites: Record<string, unknown>;
};

type UAData = {
  brands?: { brand: string; version: string }[];
  mobile?: boolean;
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
};

function gpuInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      return { proveedor: "no disponible", renderizador: "no disponible" };
    }
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      proveedor: ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR)),
      renderizador: ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER)),
    };
  } catch {
    return { proveedor: "bloqueado", renderizador: "bloqueado" };
  }
}

async function clientHints(): Promise<Record<string, unknown>> {
  const ua = (navigator as Navigator & { userAgentData?: UAData }).userAgentData;
  if (!ua?.getHighEntropyValues) {
    return {
      marcas: navigator.userAgent,
      movil: /mobi|android|iphone/i.test(navigator.userAgent),
      plataforma: navigator.platform,
    };
  }
  try {
    const high = await ua.getHighEntropyValues([
      "architecture",
      "bitness",
      "model",
      "platform",
      "platformVersion",
      "uaFullVersion",
      "fullVersionList",
      "wow64",
      "formFactors",
    ]);
    return {
      marcas: ua.brands,
      movil: ua.mobile,
      plataforma: ua.platform,
      ...high,
    };
  } catch {
    return { marcas: ua.brands, movil: ua.mobile, plataforma: ua.platform };
  }
}

async function publicIps() {
  const [v4, v6] = await Promise.all([
    fetch("https://api.ipify.org?format=json", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { ip?: string }) => d.ip || "")
      .catch(() => ""),
    fetch("https://api64.ipify.org?format=json", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { ip?: string }) => d.ip || "")
      .catch(() => ""),
  ]);
  return { ipv4: v4, ipv6: v6 && v6 !== v4 ? v6 : "" };
}

function localIps(): Promise<string[]> {
  return new Promise((resolve) => {
    const found = new Set<string>();
    const finish = () => resolve([...found]);
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("zt");
      const timer = window.setTimeout(() => {
        pc.close();
        finish();
      }, 1200);
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          window.clearTimeout(timer);
          pc.close();
          finish();
          return;
        }
        const text = event.candidate.candidate || "";
        const v4 = text.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/);
        const v6 = text.match(/\b([a-f0-9:]{2,}:[a-f0-9:]+)\b/i);
        if (v4) found.add(v4[1]);
        if (v6) found.add(v6[1]);
      };
      void pc.createOffer().then((offer) => pc.setLocalDescription(offer));
    } catch {
      finish();
    }
  });
}

async function mediaInfo() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return { camaras: 0, microfonos: 0, parlantes: 0, etiquetas: [] as string[] };
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const labels = devices.map((d) => d.label).filter(Boolean);
    return {
      camaras: devices.filter((d) => d.kind === "videoinput").length,
      microfonos: devices.filter((d) => d.kind === "audioinput").length,
      parlantes: devices.filter((d) => d.kind === "audiooutput").length,
      etiquetas: labels,
      nota:
        labels.length === 0
          ? "Los nombres (a veces HP, Logitech, Realtek) solo aparecen después de aceptar cámara o micrófono."
          : "Etiquetas reales del dispositivo; a veces incluyen marca y modelo.",
    };
  } catch {
    return { camaras: 0, microfonos: 0, parlantes: 0, etiquetas: [] as string[] };
  }
}

export async function collectTechProfile(): Promise<TechProfile> {
  const [hints, ips, locales, medios] = await Promise.all([
    clientHints(),
    publicIps(),
    localIps(),
    mediaInfo(),
  ]);
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } })
    .connection;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const modelo = String(hints.model || "").trim();

  return {
    capturadoEn: new Date().toISOString(),
    navegador: {
      nombreCompleto: navigator.userAgent,
      vendor: navigator.vendor,
      idiomas: [...navigator.languages],
      idiomaPrincipal: navigator.language,
      cookiesHabilitadas: navigator.cookieEnabled,
      pdf: Boolean((navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled),
      online: navigator.onLine,
      pistasCliente: hints,
    },
    sistema: {
      plataforma: navigator.platform,
      zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      calendario: Intl.DateTimeFormat().resolvedOptions().calendar,
      osHint: hints.platform || hints.plataforma,
      osVersion: hints.platformVersion,
      arquitectura: hints.architecture,
      bits: hints.bitness,
    },
    maquina: {
      modeloCliente: modelo || "Windows/macOS casi nunca entregan marca HP, Dell o Lenovo al navegador",
      nucleosCPU: navigator.hardwareConcurrency || null,
      memoriaRAMAproxGB: memory ?? null,
      toquesMaximos: navigator.maxTouchPoints,
      maxTouch: navigator.maxTouchPoints > 0,
    },
    pantalla: {
      interior: `${window.innerWidth}×${window.innerHeight}`,
      ventana: `${window.outerWidth}×${window.outerHeight}`,
      pantalla: `${screen.width}×${screen.height}`,
      disponible: `${screen.availWidth}×${screen.availHeight}`,
      pixelRatio: window.devicePixelRatio,
      colorDepth: screen.colorDepth,
      orientacion: screen.orientation?.type || "desconocida",
    },
    red: {
      ipv4Publica: ips.ipv4,
      ipv6Publica: ips.ipv6,
      ipsLocalesWebRTC: locales,
      conexion: conn?.effectiveType || "desconocida",
      bajadaMbps: conn?.downlink ?? null,
      latenciaMs: conn?.rtt ?? null,
      ahorroDatos: conn?.saveData ?? null,
    },
    gpu: gpuInfo(),
    medios,
    limites: {
      tema: window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro",
      contextoSeguro: window.isSecureContext,
      referrer: document.referrer || "directo",
    },
  };
}

export function deviceHint() {
  if (typeof window === "undefined") return "desktop";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  const mid = window.innerWidth < 1100;
  if (coarse && narrow) return "mobile";
  if (coarse && mid) return "tablet";
  return "desktop";
}

export function collectSignals() {
  return {
    deviceHint: deviceHint(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer,
    path: window.location.pathname,
  };
}

export async function publicIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    const data = (await res.json()) as { ip?: string };
    return data.ip || "";
  } catch {
    return "";
  }
}
