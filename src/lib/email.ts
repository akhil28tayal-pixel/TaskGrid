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
  portalLink: string
) {
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

  return sendEmail({
    to: clientEmail,
    subject,
    html,
  });
}
