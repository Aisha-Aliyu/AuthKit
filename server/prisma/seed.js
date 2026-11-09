const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || "admin@authkit.dev";
  const plainPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!plainPassword) {
    console.error("Set ADMIN_SEED_PASSWORD in your environment before running the seed.");
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("Admin already exists");
    return;
  }

  const password = await bcrypt.hash(plainPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      password,
      displayName: "AuthKit Admin",
      role: "ADMIN",
      provider: "LOCAL",
      isEmailVerified: true,
    },
  });

  console.log("Admin created:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
