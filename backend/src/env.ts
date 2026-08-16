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

export function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQL_PRIVATE_URL ||
    mysqlFromParts()
  );
}

const url = resolveDatabaseUrl();
if (url) process.env.DATABASE_URL = url;
