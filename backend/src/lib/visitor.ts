import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { prisma } from "./prisma.js";
import { clientIp, parseDevice, requestNetwork } from "./device.js";
import { publicVisitor } from "./auth.js";

export type ClientSignals = {
  visitorId?: string;
  publicIp?: string;
  publicIpv4?: string;
  publicIpv6?: string;
  localIps?: string[];
  deviceId?: string;
  deviceIp?: string;
  deviceIpKind?: string;
  fingerprintHash?: string;
  fingerprintAlgo?: string;
  deviceHint?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  timezone?: string;
  referrer?: string;
  path?: string;
  cookieConsent?: boolean;
  localStorageOk?: boolean;
  cameraStatus?: string;
  microphoneStatus?: string;
  locationStatus?: string;
  notificationStatus?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationAccuracy?: number | null;
  techProfile?: Record<string, unknown>;
  deviceModel?: string;
  gpuVendor?: string;
  gpuRenderer?: string;
  osVersion?: string;
  architecture?: string;
  cpuCores?: number;
  deviceMemoryGb?: number;
  browserVersion?: string;
  connectionType?: string;
};

const SESSION_MS = 30 * 60 * 1000;

export function resolveVisitorId(req: Request, body: ClientSignals) {
  const header = typeof req.headers["x-visitor-id"] === "string" ? req.headers["x-visitor-id"] : "";
  const cookie = req.cookies?.zt_visitor as string | undefined;
  return body.visitorId || header || cookie || "";
}

export function newVisitorId() {
  return randomUUID();
}

export function techFields(req: Request, body: ClientSignals) {
  const servidor = requestNetwork(req);
  const maquina = (body.techProfile?.maquina || {}) as Record<string, unknown>;
  const gpu = (body.techProfile?.gpu || {}) as Record<string, unknown>;
  const red = (body.techProfile?.red || {}) as Record<string, unknown>;
  const sistema = (body.techProfile?.sistema || {}) as Record<string, unknown>;
  const navegador = (body.techProfile?.navegador || {}) as Record<string, unknown>;
  const modeloHint = servidor.clientHintModelo.replace(/"/g, "").trim();
  const modeloCliente = String(body.deviceModel || maquina.modeloCliente || modeloHint || "").trim();
  const modeloUtil =
    modeloCliente && !modeloCliente.toLowerCase().includes("casi nunca") ? modeloCliente : modeloHint || null;

  return {
    publicIp: body.publicIpv4 || body.publicIp || (typeof red.ipv4Publica === "string" ? red.ipv4Publica : undefined),
    publicIpv4: body.publicIpv4 || (typeof red.ipv4Publica === "string" ? red.ipv4Publica : undefined),
    publicIpv6: body.publicIpv6 || (typeof red.ipv6Publica === "string" ? red.ipv6Publica : undefined),
    localIps: body.localIps?.length
      ? body.localIps.join(", ")
      : Array.isArray(red.ipsLocalesWebRTC)
        ? red.ipsLocalesWebRTC.join(", ")
        : undefined,
    deviceId: body.deviceId || (typeof red.idDeDispositivo === "string" ? red.idDeDispositivo : undefined),
    deviceIp:
      body.deviceIp ||
      (typeof red.ipDeEsteDispositivo === "string" ? red.ipDeEsteDispositivo : undefined),
    deviceIpKind:
      body.deviceIpKind ||
      (typeof red.origenIpDispositivo === "string" ? red.origenIpDispositivo : undefined),
    fingerprintHash:
      body.fingerprintHash ||
      (typeof (body.techProfile?.huella as { hash?: string } | undefined)?.hash === "string"
        ? (body.techProfile?.huella as { hash: string }).hash
        : undefined),
    fingerprintAlgo:
      body.fingerprintAlgo ||
      (typeof (body.techProfile?.huella as { algoritmo?: string } | undefined)?.algoritmo === "string"
        ? (body.techProfile?.huella as { algoritmo: string }).algoritmo
        : undefined),
    gpuVendor: body.gpuVendor || (typeof gpu.proveedor === "string" ? gpu.proveedor : undefined),
    gpuRenderer: body.gpuRenderer || (typeof gpu.renderizador === "string" ? gpu.renderizador : undefined),
    deviceModel: modeloUtil,
    osVersion: body.osVersion || (typeof sistema.osVersion === "string" ? String(sistema.osVersion) : undefined),
    architecture: body.architecture || (typeof sistema.arquitectura === "string" ? String(sistema.arquitectura) : undefined),
    cpuCores: body.cpuCores || (typeof maquina.nucleosCPU === "number" ? maquina.nucleosCPU : undefined),
    deviceMemoryGb:
      body.deviceMemoryGb || (typeof maquina.memoriaRAMAproxGB === "number" ? maquina.memoriaRAMAproxGB : undefined),
    browserVersion:
      body.browserVersion ||
      (typeof navegador.nombreCompleto === "string" ? navegador.nombreCompleto : undefined),
    connectionType: body.connectionType || (typeof red.conexion === "string" ? red.conexion : undefined),
    techProfile: {
      ...(body.techProfile || {}),
      servidor,
    },
  };
}

export async function touchVisitor(req: Request, body: ClientSignals) {
  const visitorId = resolveVisitorId(req, body);
  if (!visitorId) {
    const error = new Error("Inicia sesión con correo y contraseña");
    (error as Error & { status: number }).status = 401;
    throw error;
  }

  const existing = await prisma.visitor.findUnique({ where: { visitorId } });
  if (!existing?.email || !existing.passwordHash) {
    const error = new Error("Solo se guardan usuarios registrados. Los anónimos no entran al casino.");
    (error as Error & { status: number }).status = 401;
    throw error;
  }

  const userAgent = req.headers["user-agent"] || "";
  const device = parseDevice(userAgent, body.deviceHint);
  const ip = clientIp(req);
  const now = new Date();
  const tech = techFields(req, body);

  await prisma.visitor.update({
    where: { visitorId },
    data: {
      lastSeenAt: now,
      lastIp: ip,
      lastUserAgent: userAgent,
      deviceType: device.deviceType,
      deviceOs: device.deviceOs,
      browser: device.browser,
      screenWidth: body.screenWidth,
      screenHeight: body.screenHeight,
      language: body.language,
      timezone: body.timezone,
      ...tech,
      ...(typeof body.cookieConsent === "boolean"
        ? { cookieConsent: body.cookieConsent, cookieConsentAt: body.cookieConsent ? now : null }
        : {}),
      ...(typeof body.localStorageOk === "boolean" ? { localStorageOk: body.localStorageOk } : {}),
      ...(body.cameraStatus ? { cameraStatus: body.cameraStatus } : {}),
      ...(body.microphoneStatus ? { microphoneStatus: body.microphoneStatus } : {}),
      ...(body.locationStatus ? { locationStatus: body.locationStatus } : {}),
      ...(body.notificationStatus ? { notificationStatus: body.notificationStatus } : {}),
      ...(body.locationLat !== undefined ? { locationLat: body.locationLat } : {}),
      ...(body.locationLng !== undefined ? { locationLng: body.locationLng } : {}),
      ...(body.locationAccuracy !== undefined ? { locationAccuracy: body.locationAccuracy } : {}),
    },
  });

  let visit = await prisma.visit.findFirst({
    where: { visitorId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  const stale = Boolean(visit && now.getTime() - visit.lastBeatAt.getTime() > SESSION_MS);
  const deviceChanged =
    existing.deviceType !== device.deviceType ||
    Boolean(tech.deviceId && existing.deviceId && tech.deviceId !== existing.deviceId);
  const openedNewVisit = !visit || stale || deviceChanged;

  if (openedNewVisit) {
    if (visit && (stale || deviceChanged)) {
      await prisma.visit.update({ where: { id: visit.id }, data: { endedAt: now } });
    }
    visit = await prisma.visit.create({
      data: {
        visitorId,
        ip,
        publicIp: tech.publicIp || null,
        userAgent,
        deviceType: device.deviceType,
        referrer: body.referrer,
        path: body.path,
        publicIpv4: tech.publicIpv4 || null,
        publicIpv6: tech.publicIpv6 || null,
        localIps: tech.localIps || null,
        deviceId: tech.deviceId || null,
        deviceIp: tech.deviceIp || null,
        deviceIpKind: tech.deviceIpKind || null,
        fingerprintHash: tech.fingerprintHash || null,
        fingerprintAlgo: tech.fingerprintAlgo || null,
        techProfile: tech.techProfile,
      },
    });
    await prisma.visitor.update({
      where: { visitorId },
      data: { visitCount: { increment: 1 } },
    });
  } else if (visit) {
    visit = await prisma.visit.update({
      where: { id: visit.id },
      data: {
        lastBeatAt: now,
        ip,
        publicIp: tech.publicIp || visit.publicIp,
        userAgent,
        deviceType: device.deviceType,
        path: body.path || visit.path,
        publicIpv4: tech.publicIpv4 || visit.publicIpv4,
        publicIpv6: tech.publicIpv6 || visit.publicIpv6,
        localIps: tech.localIps || visit.localIps,
        deviceId: tech.deviceId || visit.deviceId,
        deviceIp: tech.deviceIp || visit.deviceIp,
        deviceIpKind: tech.deviceIpKind || visit.deviceIpKind,
        fingerprintHash: tech.fingerprintHash || visit.fingerprintHash,
        fingerprintAlgo: tech.fingerprintAlgo || visit.fingerprintAlgo,
        techProfile: tech.techProfile,
      },
    });
  }

  if (!visit) throw new Error("No se pudo abrir la visita");

  const fresh = await prisma.visitor.findUniqueOrThrow({ where: { visitorId } });
  return {
    visitor: publicVisitor(fresh),
    visit,
    isNew: false,
    newVisit: openedNewVisit,
  };
}

export async function logEvent(
  visitorId: string,
  type: string,
  message: string,
  payload?: unknown,
  visitId?: string,
) {
  return prisma.event.create({
    data: { visitorId, type, message, payload: payload as object | undefined, visitId },
  });
}
