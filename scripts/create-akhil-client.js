require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function sendClientPortalInvite(clientEmail, clientName, portalLink) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return { success: true, message: "Email skipped - SMTP not configured" };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

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
      subject: "Welcome to TaskGrid Client Portal - Your Access Link",
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

async function createAkhilClient() {
  console.log("🧪 Creating Akhil Tayal client with email...\n");

  try {
    const clientData = {
      clientType: "INDIVIDUAL",
      legalName: "Akhil Tayal",
      preferredName: "Akhil",
      primaryEmail: "akhil28tayal@gmail.com",
      billingAddressSame: true,
      servicesRequired: ["TAX_PREPARATION"],
      billingPreference: "MONTHLY",
      onboardingStatus: "PENDING_DOCS",
      fiscalYearStartMonth: 1,
      tags: [],
    };

    console.log("📝 Creating client...");
    console.log(`Name: ${clientData.legalName}`);
    console.log(`Email: ${clientData.primaryEmail}\n`);

    // Create client
    const client = await prisma.client.create({
      data: {
        clientType: clientData.clientType,
        legalName: clientData.legalName,
        preferredName: clientData.preferredName,
        primaryEmail: clientData.primaryEmail,
        billingAddressSame: clientData.billingAddressSame,
        servicesRequired: clientData.servicesRequired,
        billingPreference: clientData.billingPreference,
        onboardingStatus: clientData.onboardingStatus,
        fiscalYearStartMonth: clientData.fiscalYearStartMonth,
        tags: clientData.tags,
        status: "ACTIVE",
        approvalStatus: "APPROVED",
      },
    });

    console.log("✅ Client created successfully!");
    console.log(`Client ID: ${client.id}\n`);

    // Generate access token
    const accessToken = `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Create portal access
    const portalAccess = await prisma.clientPortalAccess.create({
      data: {
        clientId: client.id,
        email: clientData.primaryEmail,
        accessToken: accessToken,
        isActive: true,
      },
    });

    console.log("✅ Portal access created!");
    console.log(`Access Token: ${accessToken}\n`);

    // Generate portal link
    const portalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/client-portal?token=${accessToken}`;
    const clientName = clientData.preferredName || clientData.legalName;

    console.log("📧 Sending email...");
    console.log(`To: ${clientData.primaryEmail}`);
    console.log(`Portal Link: ${portalLink}\n`);

    // Send email
    const emailResult = await sendClientPortalInvite(clientData.primaryEmail, clientName, portalLink);

    if (emailResult.success) {
      console.log("✅ Email sent successfully!");
      if (emailResult.messageId) {
        console.log(`Message ID: ${emailResult.messageId}`);
      }
      console.log(`\n🎉 Complete! Client created and email sent to: ${clientData.primaryEmail}`);
      console.log(`\nPortal Link: ${portalLink}`);
    } else {
      console.log("❌ Failed to send email");
      console.log(`Error: ${emailResult.error || emailResult.message}`);
      console.log(`\nBut client was created! Portal Link: ${portalLink}`);
    }

  } catch (error) {
    console.error("❌ Failed:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAkhilClient()
  .then(() => {
    console.log("\n✅ Script complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
