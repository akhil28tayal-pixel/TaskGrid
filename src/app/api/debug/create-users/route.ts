import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    console.log("🌱 Creating users via API endpoint...");

    // Delete all existing data
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

    // Verify users were created
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true, isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: "Users created successfully",
      users: allUsers,
      credentials: {
        partner: "info@btsfinancial.com / BTS@1234",
        manager: "raghavarora14@gmail.com / Raghav@123",
        associate: "ajaytayal09@yahoo.com / Ajay@1234",
      },
    });
  } catch (error: any) {
    console.error("❌ User creation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
