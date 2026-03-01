import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  console.log("🗑️  Deleting all existing users...");
  await prisma.user.deleteMany({});
  console.log("✅ All users deleted");

  console.log("🗑️  Deleting all existing clients...");
  await prisma.client.deleteMany({});
  console.log("✅ All clients deleted");

  // Create Partner user - Shambhavi Bajpai
  const partnerPassword = await bcrypt.hash("BTS@1234", 12);

  const partner = await prisma.user.create({
    data: {
      email: "info@btsfinancial.com",
      name: "Shambhavi Bajpai",
      password: partnerPassword,
      role: "PARTNER",
      hourlyRate: 350,
      isActive: true,
    },
  });

  console.log("✅ Created Partner user:", partner.email);

  // Create Manager user - Raghav Arora
  const managerPassword = await bcrypt.hash("Raghav@123", 12);

  const manager = await prisma.user.create({
    data: {
      email: "raghavarora14@gmail.com",
      name: "Raghav Arora",
      password: managerPassword,
      role: "MANAGER",
      hourlyRate: 200,
      isActive: true,
      managerId: partner.id,
    },
  });

  console.log("✅ Created Manager user:", manager.email);

  // Create Associate user - Ajay Tayal
  const associatePassword = await bcrypt.hash("Ajay@1234", 12);

  const associate = await prisma.user.create({
    data: {
      email: "ajaytayal09@yahoo.com",
      name: "Ajay Tayal",
      password: associatePassword,
      role: "ASSOCIATE",
      hourlyRate: 100,
      isActive: true,
      managerId: manager.id,
    },
  });

  console.log("✅ Created Associate user:", associate.email);

  console.log("\n📋 Login credentials:");
  console.log("   Partner:   info@btsfinancial.com / BTS@1234");
  console.log("   Manager:   raghavarora14@gmail.com / Raghav@123");
  console.log("   Associate: ajaytayal09@yahoo.com / Ajay@1234");

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
