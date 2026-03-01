import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetUsers() {
  try {
    console.log("🌱 Resetting users...");

    console.log("🗑️  Deleting all data in correct order...");
    
    // Delete in order to respect foreign key constraints
    await prisma.payment.deleteMany({});
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.emailAttachment.deleteMany({});
    await prisma.email.deleteMany({});
    await prisma.emailThread.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.timeEntry.deleteMany({});
    await prisma.commentMention.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.milestone.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.taskAttachment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.projectAssignment.deleteMany({});
    await prisma.clientRequest.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.recurringWork.deleteMany({});
    await prisma.clientPortalAccess.deleteMany({});
    await prisma.shareholder.deleteMany({});
    await prisma.clientRelationship.deleteMany({});
    await prisma.clientContact.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.workflowTemplateAttachment.deleteMany({});
    await prisma.workflowTemplateAutomation.deleteMany({});
    await prisma.workflowTemplateSubtask.deleteMany({});
    await prisma.workflowTemplateTask.deleteMany({});
    await prisma.workflowTemplateSection.deleteMany({});
    await prisma.workflowTemplate.deleteMany({});
    await prisma.projectTag.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log("✅ All data deleted");

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

    console.log("\n🎉 User reset complete!");
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetUsers();
