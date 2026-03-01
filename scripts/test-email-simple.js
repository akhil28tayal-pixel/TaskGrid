require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log("🧪 Testing email configuration...\n");

  // Check environment variables
  console.log("Environment variables:");
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || "NOT SET"}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || "NOT SET"}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || "NOT SET"}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? "***SET***" : "NOT SET"}`);
  console.log(`SMTP_FROM: ${process.env.SMTP_FROM || "NOT SET"}`);
  console.log("");

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("❌ SMTP credentials not configured!");
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  console.log("📧 Sending test email...");
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: "TaskGrid Email Test",
      html: `
        <h1>Email Configuration Test</h1>
        <p>If you're reading this, your SMTP configuration is working correctly!</p>
        <p>This is a test email from TaskGrid.</p>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    console.log(`\nCheck your inbox at: ${process.env.SMTP_USER}`);
  } catch (error) {
    console.log("❌ Failed to send email");
    console.error("Error details:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

testEmail()
  .then(() => {
    console.log("\n✅ Test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
