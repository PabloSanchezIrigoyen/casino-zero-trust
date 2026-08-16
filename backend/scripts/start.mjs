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

function isPlaceholder(url) {
  if (!url) return true;
  return /@127\.0\.0\.1:3306\/build\b/.test(url) || String(url).startsWith("mysql://build:build@");
}

const url = [process.env.MYSQL_URL, process.env.MYSQL_PRIVATE_URL, process.env.DATABASE_URL, mysqlFromParts()].find(
  (value) => value && !isPlaceholder(value),
);

if (url) process.env.DATABASE_URL = url;
else delete process.env.DATABASE_URL;

if (!process.env.DATABASE_URL) {
  console.warn("Sin MySQL todavía. La API arranca, pero hay que conectar la base (DATABASE_URL o MYSQL_URL).");
}

const app = spawnSync(process.execPath, ["dist/index.js"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(app.status ?? 1);
