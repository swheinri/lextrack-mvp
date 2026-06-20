const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const name = (process.env.ADMIN_NAME || "Swen Heinrich").trim();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!email) throw new Error("ADMIN_EMAIL fehlt");
  if (!password || password.length < 10) throw new Error("ADMIN_PASSWORD fehlt (mind. 10 Zeichen)");

  const role = await prisma.role.upsert({
    where: { code: "ADMIN" },
    update: { name: "Administrator", isActive: true, isSystem: true },
    create: { code: "ADMIN", name: "Administrator", isActive: true, isSystem: true },
  });

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash: hash, isActive: true, roleId: role.id },
    create: { email, name, passwordHash: hash, isActive: true, roleId: role.id },
  });

  console.log("✅ Admin bereit:", { email: user.email, role: role.code });
}

main()
  .catch((e) => {
    console.error("❌ bootstrap-admin failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
