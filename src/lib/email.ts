import nodemailer from "nodemailer";

// Create transporter lazily to ensure env vars are loaded
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    // Check if email is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return { success: true, message: "Email skipped - SMTP not configured" };
    }

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendClientPortalInvite(
  clientEmail: string,
  clientName: string,
  setupLink: string
) {
  const subject = "Welcome to TaskGrid Client Portal - Set Up Your Password";
  
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to TaskGrid</h1>
        </div>
        <div class="content">
          <p>Hello ${clientName},</p>
          <p>Your client portal account has been created. To access your portal and view your projects, please set up your password by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${setupLink}" class="button">Set Up Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #059669;">${setupLink}</p>
          <p><strong>This link will expire in 7 days.</strong></p>
          <p>Once you've set your password, you can log in at any time to:</p>
          <ul>
            <li>View your ongoing projects</li>
            <li>Upload requested documents</li>
            <li>Track project progress</li>
            <li>Communicate with your account team</li>
          </ul>
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

  return sendEmail({
    to: clientEmail,
    subject,
    html,
  });
}
