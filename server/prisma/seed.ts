import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Purging all existing multi-tenant test data...");

  // 1. Clean all existing records in referential integrity order
  await prisma.otpVerification.deleteMany();
  await prisma.memberHealthProfile.deleteMany();
  await prisma.classBooking.deleteMany();
  await prisma.groupClass.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.failedAccessLog.deleteMany();
  await prisma.attendanceEntry.deleteMany();
  await prisma.deviceChangeRequest.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.gym.deleteMany();

  console.log("✨ Creating the single Platform Super Admin account...");

  // 2. Hash Super Admin password
  const adminPassHash = await bcrypt.hash("superadmin123", 10);

  // 3. Create the single Super Admin
  const superAdmin = await prisma.user.create({
    data: {
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
  console.log("👑 100% CLEAN PROTOTYPE READY — SINGLE SUPER ADMIN CREATED");
  console.log("==============================================================================");
  console.log("👉 Super Admin ID:       superadmin@ironvault.com (or username: superadmin)");
  console.log("👉 Super Admin Password: superadmin123");
  console.log("👉 Role:                 SUPER_ADMIN");
  console.log("👉 Database Status:      0 Gyms, 0 Members (100% pristine state)");
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
