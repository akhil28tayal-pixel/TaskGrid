import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Check if Partner already exists
  const existingPartner = await prisma.user.findFirst({
    where: { role: "PARTNER" },
  });

  if (existingPartner) {
    console.log("✅ Partner user already exists:", existingPartner.email);
    return;
  }

  // Create initial Partner user
  const hashedPassword = await bcrypt.hash("partner123", 12);

  const partner = await prisma.user.create({
    data: {
      email: "partner@taskgrid.com",
      name: "John Partner",
      password: hashedPassword,
      role: "PARTNER",
      phone: "+1 (555) 100-0001",
      hourlyRate: 350,
      isActive: true,
    },
  });

  console.log("✅ Created Partner user:", partner.email);

  // Create a Manager under the Partner
  const managerPassword = await bcrypt.hash("manager123", 12);

  const manager = await prisma.user.create({
    data: {
      email: "manager@taskgrid.com",
      name: "Jane Manager",
      password: managerPassword,
      role: "MANAGER",
      phone: "+1 (555) 100-0002",
      hourlyRate: 200,
      isActive: true,
      managerId: partner.id,
    },
  });

  console.log("✅ Created Manager user:", manager.email);

  // Create an Associate under the Manager
  const associatePassword = await bcrypt.hash("associate123", 12);

  const associate = await prisma.user.create({
    data: {
      email: "associate@taskgrid.com",
      name: "Bob Associate",
      password: associatePassword,
      role: "ASSOCIATE",
      phone: "+1 (555) 100-0003",
      hourlyRate: 100,
      isActive: true,
      managerId: manager.id,
    },
  });

  console.log("✅ Created Associate user:", associate.email);

  console.log("\n📋 Login credentials:");
  console.log("   Partner:   partner@taskgrid.com / partner123");
  console.log("   Manager:   manager@taskgrid.com / manager123");
  console.log("   Associate: associate@taskgrid.com / associate123");

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
