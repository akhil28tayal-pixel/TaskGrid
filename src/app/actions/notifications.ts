"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ============================================
// NOTIFICATIONS
// ============================================

export async function getNotifications(userId: string, limit?: number) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return notifications;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error("Failed to fetch unread notification count:", error);
    return 0;
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false, error: "Failed to mark notifications as read" };
  }
}

export async function deleteNotification(id: string) {
  try {
    await prisma.notification.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

// ============================================
// CREATE NOTIFICATIONS (Internal use)
// ============================================

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(data: CreateNotificationInput) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
      },
    });

    return { success: true, notification };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

// Helper functions to create specific notification types
export async function notifyTaskAssigned(
  userId: string,
  taskTitle: string,
  projectName: string,
  taskId: string
) {
  return createNotification({
    userId,
    type: "TASK_ASSIGNED",
    title: "New Task Assigned",
    message: `You have been assigned to "${taskTitle}" in project "${projectName}"`,
    actionUrl: `/projects?task=${taskId}`,
  });
}

export async function notifyTaskDueSoon(
  userId: string,
  taskTitle: string,
  dueDate: Date,
  taskId: string
) {
  return createNotification({
    userId,
    type: "TASK_DUE_SOON",
    title: "Task Due Soon",
    message: `Task "${taskTitle}" is due on ${dueDate.toLocaleDateString()}`,
    actionUrl: `/projects?task=${taskId}`,
  });
}

export async function notifyDocumentReceived(
  userId: string,
  documentName: string,
  clientName: string,
  documentId: string
) {
  return createNotification({
    userId,
    type: "DOCUMENT_RECEIVED",
    title: "Document Received",
    message: `${clientName} has uploaded "${documentName}"`,
    actionUrl: `/documents/${documentId}`,
  });
}

export async function notifyCommentMention(
  userId: string,
  mentionedBy: string,
  projectName: string,
  commentId: string
) {
  return createNotification({
    userId,
    type: "COMMENT_MENTION",
    title: "You were mentioned",
    message: `${mentionedBy} mentioned you in a comment on "${projectName}"`,
    actionUrl: `/projects?comment=${commentId}`,
  });
}

export async function notifyInvoicePaid(
  userId: string,
  invoiceNumber: string,
  clientName: string,
  amount: number
) {
  return createNotification({
    userId,
    type: "INVOICE_PAID",
    title: "Invoice Paid",
    message: `${clientName} paid invoice ${invoiceNumber} - $${amount.toFixed(2)}`,
    actionUrl: `/billing`,
  });
}

export async function notifyDeadlineReminder(
  userId: string,
  projectName: string,
  dueDate: Date,
  projectId: string
) {
  return createNotification({
    userId,
    type: "DEADLINE_REMINDER",
    title: "Deadline Approaching",
    message: `Project "${projectName}" is due on ${dueDate.toLocaleDateString()}`,
    actionUrl: `/projects/${projectId}`,
  });
}
