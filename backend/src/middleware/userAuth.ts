import type { Request, Response, NextFunction } from "express";
import { verifyUser } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export async function userAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Inicia sesión con correo y contraseña" });
    return;
  }
  try {
    const payload = verifyUser(token);
    if (payload.role !== "user" || !payload.visitorId) throw new Error("forbidden");
    const visitor = await prisma.visitor.findUnique({ where: { visitorId: payload.visitorId } });
    if (!visitor?.email) {
      res.status(401).json({ error: "La cuenta no existe o no está registrada" });
      return;
    }
    req.headers["x-visitor-id"] = visitor.visitorId;
    next();
  } catch {
    res.status(401).json({ error: "Sesión expirada. Vuelve a iniciar sesión." });
  }
}
