require('dotenv').config();
const nodemailer = require('nodemailer');

async function testResendEmail() {
  console.log("🧪 Testing Resend Email Configuration\n");

  // Check environment variables
  console.log("SMTP Configuration:");
  console.log(`Host: ${process.env.SMTP_HOST}`);
  console.log(`Port: ${process.env.SMTP_PORT}`);
  console.log(`User: ${process.env.SMTP_USER}`);
  console.log(`Password: ${process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET'}`);
  console.log(`From: ${process.env.SMTP_FROM}`);
  console.log("");

  if (!process.env.SMTP_PASSWORD || process.env.SMTP_PASSWORD.includes('your_api_key')) {
    console.log("❌ Please update SMTP_PASSWORD in .env with your Resend API key");
    console.log("\nSteps:");
    console.log("1. Go to https://resend.com/api-keys");
    console.log("2. Create a new API key");
    console.log("3. Copy the key (starts with 're_')");
    console.log("4. Update SMTP_PASSWORD in .env file");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    console.log("📧 Sending test email...");
    
    // In test mode, Resend only allows sending to the verified account email
    const testEmail = "mail.taskgrid@gmail.com"; // Resend verified email
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: testEmail,
      subject: "TaskGrid Email Test - Resend",
      html: `
        <h1>Email Test Successful!</h1>
        <p>Your Resend SMTP configuration is working correctly.</p>
        <p>This email was sent from TaskGrid using Resend.</p>
        <hr>
        <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    console.log(`\nCheck your inbox at: ${testEmail}`);
    console.log("\n🎉 Resend configuration is working!");
    
  } catch (error) {
    console.error("❌ Failed to send email");
    console.error("Error:", error.message);
    
    if (error.code === 'EAUTH') {
      console.log("\n💡 Authentication failed. Please check:");
      console.log("1. Your Resend API key is correct");
      console.log("2. The API key starts with 're_'");
      console.log("3. SMTP_USER is set to 'resend'");
    }
  }
}

testResendEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
