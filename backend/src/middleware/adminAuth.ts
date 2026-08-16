import type { Request, Response, NextFunction } from "express";
import { verifyAdmin } from "../lib/auth.js";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Sesión de administrador requerida" });
    return;
  }
  try {
    const payload = verifyAdmin(token);
    if (payload.role !== "admin") throw new Error("forbidden");
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
