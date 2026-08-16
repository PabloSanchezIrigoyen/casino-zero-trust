import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USER || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  const removed = await prisma.visitor.deleteMany({
    where: {
      OR: [{ email: "" }, { visitorId: { startsWith: "demo-" } }],
    },
  });

  console.log("Administrador listo:", username);
  console.log("Usuarios anónimos o de prueba eliminados:", removed.count);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
