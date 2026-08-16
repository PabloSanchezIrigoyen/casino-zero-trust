import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "lab-secret";

export function signAdmin(username: string) {
  return jwt.sign({ role: "admin", username }, secret, { expiresIn: "12h" });
}

export function verifyAdmin(token: string) {
  return jwt.verify(token, secret) as { role: string; username: string };
}

export function signUser(visitorId: string, email: string) {
  return jwt.sign({ role: "user", visitorId, email }, secret, { expiresIn: "12h" });
}

export function verifyUser(token: string) {
  return jwt.verify(token, secret) as { role: string; visitorId: string; email: string };
}

export function publicVisitor<T extends { passwordHash?: string | null }>(visitor: T) {
  const { passwordHash: _hidden, ...rest } = visitor;
  return rest;
}
