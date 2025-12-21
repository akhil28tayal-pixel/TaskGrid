"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

/**
 * Send notification to client when a task is assigned to them
 */
export async function notifyClientOfTask(taskId: string) {
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
      <h2>New Task Assigned</h2>
      <p>Hello ${client.preferredName || client.legalName},</p>
      <p>A new task has been assigned to you:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        ${task.description ? `<p>${task.description}</p>` : ''}
        <p><strong>Project:</strong> ${task.project.name}</p>
        ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
      </div>
      
      <p>Please log in to your client portal to view the task details and take action.</p>
      
      <p style="margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}/client-login" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Task in Portal
        </a>
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        If you have any questions, please contact your account manager.
      </p>
    `;

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
      },
    });

    revalidatePath("/client-dashboard");
    revalidatePath("/client-tasks");

    return { success: true };
  } catch (error) {
    console.error("Failed to notify client of task:", error);
    return { success: false, error: "Failed to send notification" };
  }
}

/**
 * Get unread notifications for a client
 */
export async function getClientNotifications(clientId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: clientId,
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return { success: true, notifications };
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return { success: false, error: "Failed to fetch notifications", notifications: [] };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Failed to update notification" };
  }
}

/**
 * Mark all notifications as read for a client
 */
export async function markAllNotificationsAsRead(clientId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: clientId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false, error: "Failed to update notifications" };
  }
}
