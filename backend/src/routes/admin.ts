import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { publicVisitor, signAdmin } from "../lib/auth.js";
import { adminAuth } from "../middleware/adminAuth.js";

export const adminRouter = Router();

const registered = { email: { not: "" } };

adminRouter.post("/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const admin = await prisma.admin.findUnique({ where: { username: username || "" } });
  if (!admin || !password || !(await bcrypt.compare(password, admin.passwordHash))) {
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    return;
  }
  res.json({ token: signAdmin(admin.username), username: admin.username });
});

adminRouter.get("/stats", adminAuth, async (_req, res) => {
  const where = registered;
  const [usuarios, visitas, eventos, camara, microfono, ubicacion, cookies] = await Promise.all([
    prisma.visitor.count({ where }),
    prisma.visit.count({ where: { visitor: where } }),
    prisma.event.count({ where: { visitor: where } }),
    prisma.visitor.count({ where: { ...where, cameraStatus: "granted" } }),
    prisma.visitor.count({ where: { ...where, microphoneStatus: "granted" } }),
    prisma.visitor.count({ where: { ...where, locationStatus: "granted" } }),
    prisma.visitor.count({ where: { ...where, cookieConsent: true } }),
  ]);

  res.json({ usuarios, visitas, eventos, camara, microfono, ubicacion, cookies });
});

adminRouter.get("/visitors", adminAuth, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const device = typeof req.query.device === "string" ? req.query.device : "";
  const visitors = await prisma.visitor.findMany({
    where: {
      AND: [
        registered,
        q
          ? {
              OR: [
                { email: { contains: q } },
                { visitorId: { contains: q } },
                { lastIp: { contains: q } },
                { publicIp: { contains: q } },
                { browser: { contains: q } },
              ],
            }
          : {},
        device ? { deviceType: device } : {},
      ],
    },
    orderBy: { lastSeenAt: "desc" },
    include: {
      _count: { select: { events: true, visits: true, permissions: true } },
      visits: {
        where: { endedAt: null },
        orderBy: { lastBeatAt: "desc" },
        take: 1,
        select: { lastBeatAt: true, endedAt: true },
      },
    },
  });
  const limite = 20_000;
  res.json({
    visitors: visitors.map((row) => {
      const { visits, ...rest } = row;
      const pulso = visits[0]?.lastBeatAt;
      const enLinea = Boolean(pulso && Date.now() - pulso.getTime() < limite);
      return { ...publicVisitor(rest), enLinea };
    }),
  });
});

adminRouter.get("/visitors/:visitorId", adminAuth, async (req, res) => {
  const visitorId = String(req.params.visitorId);
  const visitor = await prisma.visitor.findUnique({
    where: { visitorId },
    include: {
      visits: { orderBy: { startedAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 200 },
      permissions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!visitor) {
    res.status(404).json({ error: "No encontrado" });
    return;
  }
  res.json({ visitor: publicVisitor(visitor) });
});

adminRouter.delete("/visitors/:visitorId", adminAuth, async (req, res) => {
  await prisma.visitor.delete({ where: { visitorId: String(req.params.visitorId) } });
  res.json({ ok: true });
});

adminRouter.get("/events", adminAuth, async (req, res) => {
  const type = typeof req.query.type === "string" ? req.query.type : "";
  const events = await prisma.event.findMany({
    where: {
      ...(type ? { type } : {}),
      visitor: registered,
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { visitor: { select: { email: true, visitorId: true, deviceType: true } } },
  });
  res.json({ events });
});
