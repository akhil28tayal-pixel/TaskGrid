import { sendClientPortalInvite } from "../src/lib/email.js";

async function testEmail() {
  console.log("🧪 Testing email configuration...\n");

  // Check environment variables
  console.log("Environment variables:");
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || "NOT SET"}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || "NOT SET"}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || "NOT SET"}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? "***SET***" : "NOT SET"}`);
  console.log(`SMTP_FROM: ${process.env.SMTP_FROM || "NOT SET"}`);
  console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || "NOT SET"}`);
  console.log("");

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("❌ SMTP credentials not configured!");
    console.log("Please add SMTP_USER and SMTP_PASSWORD to your .env file");
    return;
  }

  // Test sending an email
  console.log("📧 Sending test email...");
  const testEmail = process.env.SMTP_USER; // Send to yourself for testing
  const testName = "Test Client";
  const testToken = "test_token_12345";
  const testLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/client-portal?token=${testToken}`;

  const result = await sendClientPortalInvite(testEmail, testName, testLink);

  if (result.success) {
    console.log("✅ Email sent successfully!");
    console.log(`Message ID: ${result.messageId}`);
    console.log(`\nCheck your inbox at: ${testEmail}`);
  } else {
    console.log("❌ Failed to send email");
    console.log(`Error: ${result.error}`);
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
