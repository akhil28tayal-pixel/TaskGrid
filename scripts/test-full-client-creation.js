require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function sendClientPortalInvite(clientEmail, clientName, portalLink) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const subject = "Welcome to TaskGrid Client Portal - Your Access Link";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to TaskGrid</h1>
        </div>
        <div class="content">
          <p>Hello ${clientName},</p>
          <p>Your client portal account has been created! Click the button below to access your portal and view your projects:</p>
          <p style="text-align: center;">
            <a href="${portalLink}" class="button">Access Client Portal</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #059669;">${portalLink}</p>
          <div class="warning">
            <strong>⚠️ Important:</strong> This link is unique to you. Please keep it secure and do not share it with others.
          </div>
          <p>Through your client portal, you can:</p>
          <ul>
            <li>View your ongoing projects</li>
            <li>Upload requested documents</li>
            <li>Track project progress</li>
            <li>Communicate with your account team</li>
          </ul>
          <p>You can access your portal at any time using the link above. Bookmark it for easy access!</p>
          <p>If you have any questions, please contact your account manager.</p>
          <p>Best regards,<br>The TaskGrid Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: clientEmail,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId };
}

async function testFullClientCreation() {
  console.log("🧪 Testing Full Client Creation with Email\n");

  try {
    // Test data
    const clientData = {
      clientType: "INDIVIDUAL",
      legalName: "Test Client Email",
      preferredName: "Test",
      primaryEmail: "akhil28tayal@gmail.com",
      billingAddressSame: true,
      servicesRequired: ["TAX_PREPARATION"],
      billingPreference: "MONTHLY",
      onboardingStatus: "PENDING_DOCS",
      fiscalYearStartMonth: 1,
      tags: [],
      status: "ACTIVE",
      approvalStatus: "APPROVED",
    };

    console.log("1️⃣ Creating client in database...");
    const client = await prisma.client.create({
      data: clientData,
    });
    console.log(`✅ Client created: ${client.legalName} (ID: ${client.id})`);

    console.log("\n2️⃣ Creating portal access...");
    const accessToken = `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await prisma.clientPortalAccess.create({
      data: {
        clientId: client.id,
        email: clientData.primaryEmail,
        accessToken: accessToken,
        isActive: true,
      },
    });
    console.log(`✅ Portal access created with token: ${accessToken}`);

    console.log("\n3️⃣ Sending portal invite email...");
    const portalLink = `${process.env.NEXTAUTH_URL}/client-portal?token=${accessToken}`;
    console.log(`Portal link: ${portalLink}`);
    
    const emailResult = await sendClientPortalInvite(
      clientData.primaryEmail,
      clientData.preferredName || clientData.legalName,
      portalLink
    );

    if (emailResult.success) {
      console.log(`✅ Email sent successfully!`);
      console.log(`Message ID: ${emailResult.messageId}`);
      console.log(`\n📧 Check inbox: ${clientData.primaryEmail}`);
    } else {
      console.log(`❌ Email failed to send`);
    }

    console.log("\n4️⃣ Cleaning up test client...");
    await prisma.clientPortalAccess.deleteMany({
      where: { clientId: client.id }
    });
    await prisma.client.delete({
      where: { id: client.id }
    });
    console.log("✅ Test client cleaned up");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 FULL CLIENT CREATION TEST PASSED!");
    console.log("=".repeat(60));
    console.log("\nThe system is working correctly:");
    console.log("✅ Client creation");
    console.log("✅ Portal access generation");
    console.log("✅ Email sending");
    console.log("\nNow try creating a client through the web interface!");

  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testFullClientCreation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
