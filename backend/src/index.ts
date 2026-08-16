import "dotenv/config";
import "./env.js";
import { spawn } from "node:child_process";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";
import { sessionRouter } from "./routes/session.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
app.set("trust proxy", 1);

const origins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((value) => value.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/$/, "");
      callback(null, origins.includes(normalized));
    },
    credentials: true,
  }),
);
app.use((_req, res, next) => {
  res.setHeader(
    "Accept-CH",
    "Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Full-Version-List",
  );
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, lab: "Casino Zero Trust", time: new Date().toISOString() });
});

app.use("/api/session", sessionRouter);
app.use("/api/admin", adminRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del laboratorio" });
});

function pushSchema() {
  if (!process.env.DATABASE_URL) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["prisma", "db", "push", "--skip-generate"], {
      stdio: "inherit",
      env: process.env,
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`prisma db push salió con código ${code}`));
    });
    child.on("error", reject);
  });
}

async function ensureAdmin() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: { username: "admin", passwordHash },
  });
}

const port = Number(process.env.PORT || 4000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Casino Zero Trust API en puerto ${port}`);
  void (async () => {
    try {
      await pushSchema();
      await ensureAdmin();
      const limpios = await prisma.visitor.deleteMany({
        where: { OR: [{ email: "" }, { visitorId: { startsWith: "demo-" } }] },
      });
      if (limpios.count > 0) {
        console.log(`Se eliminaron ${limpios.count} registros anónimos o de prueba`);
      }
    } catch (error) {
      console.warn("Arranque de datos omitido:", error instanceof Error ? error.message : error);
    }
  })();
});
