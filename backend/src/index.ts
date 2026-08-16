import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { prisma } from "./lib/prisma.js";
import { sessionRouter } from "./routes/session.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
const origin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin,
    credentials: true,
  }),
);
app.use((req, res, next) => {
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

const port = Number(process.env.PORT || 4000);
app.listen(port, async () => {
  try {
    const limpios = await prisma.visitor.deleteMany({
      where: { OR: [{ email: "" }, { visitorId: { startsWith: "demo-" } }] },
    });
    if (limpios.count > 0) {
      console.log(`Se eliminaron ${limpios.count} registros anónimos o de prueba`);
    }
  } catch (error) {
    console.warn("Limpieza de usuarios anónimos omitida:", error instanceof Error ? error.message : error);
  }
  console.log(`Casino Zero Trust API en http://localhost:${port}`);
});
