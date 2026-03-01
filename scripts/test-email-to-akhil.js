require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailToAkhil() {
  console.log("🧪 Testing Email to akhil28tayal@gmail.com\n");

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

    console.log("📧 Sending test email to akhil28tayal@gmail.com...");
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: "akhil28tayal@gmail.com",
      subject: "TaskGrid Portal Access Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to TaskGrid!</h1>
          <p>This is a test email to verify that emails can be sent to your address.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Test Portal Access Link</h2>
            <p>Click the button below to access your client portal:</p>
            <a href="http://localhost:3000/client-portal?token=test_token_123" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
              Access Portal
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you received this email, it means the email configuration is working correctly!
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: TaskGrid Application
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    console.log(`\n🎉 Check your inbox at: akhil28tayal@gmail.com`);
    console.log("\nIf you received the email, the Resend configuration is working perfectly!");
    
  } catch (error) {
    console.error("❌ Failed to send email");
    console.error("Error:", error.message);
    
    if (error.message.includes('550')) {
      console.log("\n💡 The email address might not be verified in Resend yet.");
      console.log("Please check:");
      console.log("1. Go to https://resend.com/emails");
      console.log("2. Verify that akhil28tayal@gmail.com is added and verified");
      console.log("3. Check your email for the verification link from Resend");
    }
  }
}

testEmailToAkhil()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
