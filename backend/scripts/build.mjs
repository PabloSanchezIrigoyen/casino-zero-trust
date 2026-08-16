import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.MYSQL_URL ||
    process.env.MYSQL_PRIVATE_URL ||
    "mysql://build:build@127.0.0.1:3306/build";
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (result.status) process.exit(result.status);
}

run("npx", ["prisma", "generate"]);
run("npx", ["tsc"]);
