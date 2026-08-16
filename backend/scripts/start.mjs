import "dotenv/config";
import { spawnSync } from "node:child_process";

function mysqlFromParts() {
  const host = process.env.MYSQLHOST || process.env.MYSQL_HOST;
  if (!host) return "";
  const user = process.env.MYSQLUSER || process.env.MYSQL_USER || "root";
  const raw = process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASSWORD || "";
  const pass = encodeURIComponent(raw);
  const port = process.env.MYSQLPORT || process.env.MYSQL_PORT || "3306";
  const db = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || "railway";
  return `mysql://${user}:${pass}@${host}:${port}/${db}`;
}

const url =
  process.env.DATABASE_URL ||
  process.env.MYSQL_URL ||
  process.env.MYSQL_PRIVATE_URL ||
  mysqlFromParts();

if (!url) {
  console.error("Falta DATABASE_URL o MYSQL_URL. Conecta MySQL en Railway/Render.");
  process.exit(1);
}

process.env.DATABASE_URL = url;

const push = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
if (push.status) process.exit(push.status);

const app = spawnSync(process.execPath, ["dist/index.js"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(app.status ?? 1);
