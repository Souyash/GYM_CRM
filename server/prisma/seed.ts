import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🛡️ Checking Platform Super Admin account (non-destructive seed)...");

  // Hash Super Admin password
  const adminPassHash = await bcrypt.hash("superadmin123", 10);

  // Safely upsert Super Admin so existing data is NEVER wiped
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@ironvault.com" },
    update: {
      role: "SUPER_ADMIN",
      deviceStatus: "NORMAL"
    },
    create: {
      email: "superadmin@ironvault.com",
      fullName: "Super Admin",
      passwordHash: adminPassHash,
      role: "SUPER_ADMIN",
      phone: "+1-555-019-8800",
      gymId: null,
      facilityId: null,
      deviceStatus: "NORMAL"
    }
  });

  console.log("==============================================================================");
  console.log("👑 PROTOTYPE SEED VERIFIED — SUPER ADMIN READY (DATA PRESERVED)");
  console.log("==============================================================================");
  console.log("👉 Super Admin Email:    ", superAdmin.email);
  console.log("👉 Role:                 ", superAdmin.role);
  console.log("==============================================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
