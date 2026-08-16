import type { Request } from "express";
import { UAParser } from "ua-parser-js";

export type DeviceSnapshot = {
  deviceType: string;
  deviceOs: string;
  browser: string;
};

export function parseDevice(userAgent: string, clientHint?: string): DeviceSnapshot {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const os = parser.getOS();
  const browser = parser.getBrowser();

  let deviceType = device.type || "desktop";
  if (clientHint === "mobile" || clientHint === "tablet" || clientHint === "desktop") {
    deviceType = clientHint;
  } else if (!device.type) {
    const ua = userAgent.toLowerCase();
    if (/ipad|tablet/.test(ua)) deviceType = "tablet";
    else if (/mobi|iphone|android/.test(ua)) deviceType = "mobile";
    else deviceType = "desktop";
  }

  return {
    deviceType,
    deviceOs: [os.name, os.version].filter(Boolean).join(" ") || "desconocido",
    browser: [browser.name, browser.version].filter(Boolean).join(" ") || "desconocido",
  };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.length > 0) return realIp;
  return req.socket?.remoteAddress || "desconocida";
}

export function requestNetwork(req: Request) {
  const header = (name: string) => {
    const value = req.headers[name];
    return typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : "";
  };
  return {
    ipSocket: req.socket?.remoteAddress || "",
    ipForwarded: header("x-forwarded-for"),
    ipReal: header("x-real-ip"),
    idiomaAceptado: header("accept-language"),
    clientHintMarcas: header("sec-ch-ua"),
    clientHintModelo: header("sec-ch-ua-model"),
    clientHintPlataforma: header("sec-ch-ua-platform"),
    clientHintPlataformaVersion: header("sec-ch-ua-platform-version"),
    clientHintArch: header("sec-ch-ua-arch"),
    clientHintBits: header("sec-ch-ua-bitness"),
    clientHintMovil: header("sec-ch-ua-mobile"),
    clientHintVersiones: header("sec-ch-ua-full-version-list"),
  };
}
