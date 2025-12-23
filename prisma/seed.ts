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

  // Create a demo client
  const demoClient = await prisma.client.create({
    data: {
      clientType: "BUSINESS",
      legalName: "Acme Corporation",
      preferredName: "Acme Corp",
      entityType: "C_CORP",
      primaryEmail: "contact@acme.com",
      primaryPhone: "+1 (555) 200-0001",
      status: "ACTIVE",
      servicesRequired: ["TAX_PREPARATION", "BOOKKEEPING"],
      onboardingStatus: "ONBOARDING_COMPLETE",
      createdById: partner.id,
    },
  });

  console.log("✅ Created Demo Client:", demoClient.legalName);

  // Create client portal access for demo client
  const clientPassword = await bcrypt.hash("client123", 12);

  await prisma.clientPortalAccess.create({
    data: {
      clientId: demoClient.id,
      email: "demo@client.com",
      password: clientPassword,
      isActive: true,
    },
  });

  console.log("✅ Created Client Portal Access for demo client");

  // Create a sample project for the demo client
  const demoProject = await prisma.project.create({
    data: {
      name: "2024 Tax Return",
      description: "Annual tax preparation for Acme Corp",
      type: "TAX_RETURN_BUSINESS",
      status: "IN_PROGRESS",
      priority: "HIGH",
      clientId: demoClient.id,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log("✅ Created Demo Project:", demoProject.name);

  // Create sample tasks for the project
  await prisma.task.createMany({
    data: [
      {
        title: "Gather financial documents",
        status: "COMPLETED",
        taskType: "TEAM_TASK",
        projectId: demoProject.id,
        createdById: partner.id,
        order: 1,
      },
      {
        title: "Review income statements",
        status: "IN_PROGRESS",
        taskType: "TEAM_TASK",
        projectId: demoProject.id,
        createdById: partner.id,
        order: 2,
      },
      {
        title: "Prepare tax calculations",
        status: "TODO",
        taskType: "TEAM_TASK",
        projectId: demoProject.id,
        createdById: partner.id,
        order: 3,
      },
    ],
  });

  console.log("✅ Created sample tasks for demo project");

  // Create a client request
  await prisma.clientRequest.create({
    data: {
      title: "Upload Bank Statements",
      description: "Please upload your bank statements for 2024",
      type: "DOCUMENT_UPLOAD",
      status: "PENDING",
      clientId: demoClient.id,
      projectId: demoProject.id,
      createdById: partner.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  console.log("✅ Created sample client request");

  console.log("\n📋 Login credentials:");
  console.log("   Partner:   partner@taskgrid.com / partner123");
  console.log("   Manager:   manager@taskgrid.com / manager123");
  console.log("   Associate: associate@taskgrid.com / associate123");
  console.log("\n📋 Client Portal credentials:");
  console.log("   Client:    demo@client.com / client123");

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
