import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { publicVisitor, signUser } from "../lib/auth.js";
import { logEvent, newVisitorId, techFields, touchVisitor, type ClientSignals } from "../lib/visitor.js";
import { userAuth } from "../middleware/userAuth.js";
import { clientIp, parseDevice } from "../lib/device.js";

export const sessionRouter = Router();

function signals(req: { body?: ClientSignals }): ClientSignals {
  return req.body || {};
}

function normalizeEmail(email: unknown) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setSessionCookie(res: { cookie: (name: string, value: string, opts: object) => void }, visitorId: string, allowed: boolean) {
  if (!allowed) return;
  const crossSite = process.env.NODE_ENV === "production";
  const opts = {
    httpOnly: false,
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite,
    maxAge: 1000 * 60 * 60 * 24 * 30,
  };
  res.cookie("zt_visitor", visitorId, opts);
  res.cookie("zt_consent", "1", opts);
}

sessionRouter.post("/register", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  if (!validEmail(email)) {
    res.status(400).json({ error: "Escribe un correo válido" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    return;
  }
  const exists = await prisma.visitor.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ error: "Ese correo ya tiene una cuenta. Inicia sesión." });
    return;
  }

  const userAgent = req.headers["user-agent"] || "";
  const device = parseDevice(userAgent, req.body?.deviceHint);
  const visitor = await prisma.visitor.create({
    data: {
      visitorId: newVisitorId(),
      email,
      passwordHash: await bcrypt.hash(password, 10),
      lastIp: clientIp(req),
      lastUserAgent: userAgent,
      deviceType: device.deviceType,
      deviceOs: device.deviceOs,
      browser: device.browser,
      screenWidth: req.body?.screenWidth,
      screenHeight: req.body?.screenHeight,
      language: req.body?.language,
      timezone: req.body?.timezone,
      ...techFields(req, req.body || {}),
    },
  });

  await logEvent(visitor.visitorId, "registro", `Se creó la cuenta ${email}.`, { email, deviceType: visitor.deviceType });

  res.json({
    token: signUser(visitor.visitorId, visitor.email),
    visitor: publicVisitor(visitor),
  });
});

sessionRouter.post("/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const visitor = await prisma.visitor.findUnique({ where: { email } });
  if (!visitor || !(await bcrypt.compare(password, visitor.passwordHash))) {
    res.status(401).json({ error: "Correo o contraseña incorrectos" });
    return;
  }

  await logEvent(visitor.visitorId, "login", `${email} inició sesión.`, { email, deviceType: visitor.deviceType });

  res.json({
    token: signUser(visitor.visitorId, visitor.email),
    visitor: publicVisitor(visitor),
  });
});

sessionRouter.use(userAuth);

sessionRouter.post("/heartbeat", async (req, res) => {
  try {
    const { visitor, visit, newVisit } = await touchVisitor(req, signals(req));
    if (newVisit) {
      await logEvent(
        visitor.visitorId,
        "visita",
        `${visitor.email} entró desde ${visitor.deviceType === "mobile" ? "celular" : visitor.deviceType === "tablet" ? "tablet" : "computadora"} (${visitor.browser}).`,
        {
          visitCount: visitor.visitCount,
          deviceType: visitor.deviceType,
          ip: visitor.lastIp,
          publicIp: visitor.publicIp,
        },
        visit.id,
      );
    }
    setSessionCookie(res, visitor.visitorId, Boolean(visitor.cookieConsent));
    res.json({ visitor, visit });
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 500;
    res.status(status).json({ error: error instanceof Error ? error.message : "Error de sesión" });
  }
});

sessionRouter.post("/leave", async (req, res) => {
  const visitorId = typeof req.headers["x-visitor-id"] === "string" ? req.headers["x-visitor-id"] : "";
  if (!visitorId) {
    res.json({ ok: true });
    return;
  }
  const closed = await prisma.visit.updateMany({
    where: { visitorId, endedAt: null },
    data: { endedAt: new Date() },
  });
  if (closed.count > 0) {
    await logEvent(visitorId, "salida", "El usuario salió del casino o cerró la sesión.");
  }
  res.json({ ok: true, closed: closed.count });
});

sessionRouter.get("/me", async (req, res) => {
  const visitorId = typeof req.headers["x-visitor-id"] === "string" ? req.headers["x-visitor-id"] : "";
  const visitor = await prisma.visitor.findUnique({
    where: { visitorId },
    include: {
      visits: { orderBy: { startedAt: "desc" }, take: 20 },
      permissions: { orderBy: { createdAt: "desc" }, take: 40 },
      events: { orderBy: { createdAt: "desc" }, take: 40 },
    },
  });
  if (!visitor) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  res.json({ visitor: publicVisitor(visitor) });
});

sessionRouter.post("/consent", async (req, res) => {
  const { visitor, visit } = await touchVisitor(req, signals(req));
  const { cookieConsent, localStorageOk } = req.body as ClientSignals;

  if (typeof cookieConsent === "boolean") {
    await prisma.permissionLog.create({
      data: {
        visitorId: visitor.visitorId,
        permission: "cookies",
        status: cookieConsent ? "granted" : "denied",
        context: "Banner de cookies. Recuerda la sesión y el consentimiento.",
      },
    });
    await logEvent(
      visitor.visitorId,
      "consentimiento",
      cookieConsent ? `${visitor.email} aceptó cookies.` : `${visitor.email} rechazó cookies.`,
      { cookieConsent },
      visit.id,
    );
  }

  if (typeof localStorageOk === "boolean") {
    await prisma.permissionLog.create({
      data: {
        visitorId: visitor.visitorId,
        permission: "localStorage",
        status: localStorageOk ? "granted" : "denied",
        context: "Almacenamiento técnico del navegador: sesión, fichas y resolución.",
      },
    });
    await logEvent(
      visitor.visitorId,
      "consentimiento",
      localStorageOk
        ? `${visitor.email} autorizó el almacenamiento local.`
        : `${visitor.email} no autorizó el almacenamiento local.`,
      { localStorageOk },
      visit.id,
    );
  }

  const fresh = await prisma.visitor.findUniqueOrThrow({ where: { visitorId: visitor.visitorId } });
  setSessionCookie(res, fresh.visitorId, Boolean(fresh.cookieConsent));
  res.json({ visitor: publicVisitor(fresh) });
});

sessionRouter.post("/permissions", async (req, res) => {
  const body = req.body as ClientSignals & { permission?: string; status?: string; context?: string };
  const { visitor, visit } = await touchVisitor(req, body);

  if (body.permission && body.status) {
    await prisma.permissionLog.create({
      data: {
        visitorId: visitor.visitorId,
        permission: body.permission,
        status: body.status,
        context: body.context || "Solicitud explícita desde el casino.",
      },
    });
    const names: Record<string, string> = {
      camera: "cámara",
      microphone: "micrófono",
      location: "ubicación",
      notifications: "notificaciones",
      cookies: "cookies",
      localStorage: "almacenamiento local",
    };
    const states: Record<string, string> = { granted: "concedido", denied: "denegado", prompt: "pendiente" };
    await logEvent(
      visitor.visitorId,
      "permiso",
      `${visitor.email}: ${names[body.permission] || body.permission} ${states[body.status] || body.status}.`,
      { permission: body.permission, status: body.status, context: body.context },
      visit.id,
    );
  }

  const fresh = await prisma.visitor.findUniqueOrThrow({ where: { visitorId: visitor.visitorId } });
  res.json({ visitor: publicVisitor(fresh) });
});

sessionRouter.post("/events", async (req, res) => {
  const { visitor, visit } = await touchVisitor(req, signals(req));
  const { type, message, payload } = req.body as { type?: string; message?: string; payload?: unknown };
  const event = await logEvent(visitor.visitorId, type || "cliente", message || "Evento", payload, visit.id);
  res.json({ event });
});

sessionRouter.get("/awareness", async (req, res) => {
  const visitorId = typeof req.headers["x-visitor-id"] === "string" ? req.headers["x-visitor-id"] : "";
  const visitor = await prisma.visitor.findUnique({
    where: { visitorId },
    include: {
      permissions: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 80 },
      visits: { orderBy: { startedAt: "desc" } },
    },
  });
  if (!visitor) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const granted = [
    visitor.cookieConsent ? "cookies" : null,
    visitor.localStorageOk ? "almacenamiento local" : null,
    visitor.cameraStatus === "granted" ? "cámara" : null,
    visitor.microphoneStatus === "granted" ? "micrófono" : null,
    visitor.locationStatus === "granted" ? "ubicación" : null,
    visitor.notificationStatus === "granted" ? "notificaciones" : null,
  ].filter(Boolean) as string[];

  res.json({
    visitor: publicVisitor(visitor),
    grantedCount: granted.length,
    granted,
    technical: {
      email: visitor.email,
      ip: visitor.lastIp,
      publicIp: visitor.publicIp,
      deviceType: visitor.deviceType,
      deviceOs: visitor.deviceOs,
      browser: visitor.browser,
      language: visitor.language,
      timezone: visitor.timezone,
      screen: `${visitor.screenWidth || "?"}×${visitor.screenHeight || "?"}`,
      visitCount: visitor.visitCount,
      firstSeenAt: visitor.firstSeenAt,
      lastSeenAt: visitor.lastSeenAt,
    },
  });
});
