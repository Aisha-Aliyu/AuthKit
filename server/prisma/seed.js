const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@authkit.dev" },
  });

  if (existing) {
    console.log("Admin already exists");
    return;
  }

  const password = await bcrypt.hash("Admin@AuthKit1!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@authkit.dev",
      password,
      displayName: "AuthKit Admin",
      role: "ADMIN",
      provider: "LOCAL",
      isEmailVerified: true,
    },
  });

  console.log("Admin created:", admin.email);
  console.log("Password: Admin@AuthKit1!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
