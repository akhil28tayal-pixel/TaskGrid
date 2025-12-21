"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

/**
 * Send notification to client when a CLIENT_REQUEST task is created or assigned
 * This should be called from the project editor when a task is marked to notify the client
 */
export async function sendTaskNotificationToClient(taskId: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            client: {
              include: {
                portalAccess: true,
              },
            },
          },
        },
      },
    });

    if (!task || !task.project?.client) {
      return { success: false, error: "Task or client not found" };
    }

    // Only send notifications for CLIENT_REQUEST type tasks
    if (task.taskType !== "CLIENT_REQUEST") {
      return { success: false, error: "Task is not a client request" };
    }

    const client = task.project.client;
    const clientEmail = client.portalAccess?.email || client.primaryEmail;

    if (!clientEmail) {
      return { success: false, error: "Client email not found" };
    }

    // Update task to mark notification as sent
    await prisma.task.update({
      where: { id: taskId },
      data: { clientNotificationSentAt: new Date() },
    });

    // Send email notification
    const emailSubject = `New Task Assigned: ${task.title}`;
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .task-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Task Assigned</h1>
          </div>
          <div class="content">
            <p>Hello ${client.preferredName || client.legalName},</p>
            <p>A new task has been assigned to you in the <strong>${task.project.name}</strong> project:</p>
            
            <div class="task-box">
              <h2 style="margin-top: 0; color: #2563eb;">${task.title}</h2>
              ${task.description ? `<p style="margin: 10px 0;">${task.description}</p>` : ''}
              <div style="margin-top: 15px;">
                <p style="margin: 5px 0;"><strong>Project:</strong> ${task.project.name}</p>
                ${task.dueDate ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Priority:</strong> ${task.priority}</p>
              </div>
            </div>
            
            <p>Please log in to your client portal to view the task details and take action.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/client-login" class="button">
                View Task in Portal
              </a>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact your account manager.</p>
              <p style="font-size: 12px; color: #9ca3af;">This is an automated message from TaskGrid</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail({
      to: clientEmail,
      subject: emailSubject,
      html: emailBody,
    });

    // Create a notification record
    await prisma.notification.create({
      data: {
        userId: client.id,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned",
        message: `You have been assigned a new task: ${task.title}`,
        relatedId: taskId,
        relatedType: "TASK",
        actionUrl: "/client-tasks",
      },
    });

    revalidatePath("/client-dashboard");
    revalidatePath("/client-tasks");

    console.log(`✅ Task notification sent to ${clientEmail} for task: ${task.title}`);

    return { success: true, message: "Notification sent successfully" };
  } catch (error) {
    console.error("Failed to send task notification:", error);
    return { success: false, error: "Failed to send notification" };
  }
}

/**
 * Batch send notifications for multiple tasks
 */
export async function sendBulkTaskNotifications(taskIds: string[]) {
  try {
    const results = await Promise.all(
      taskIds.map(taskId => sendTaskNotificationToClient(taskId))
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: true,
      message: `Sent ${successCount} notifications, ${failureCount} failed`,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error("Failed to send bulk notifications:", error);
    return { success: false, error: "Failed to send bulk notifications" };
  }
}
