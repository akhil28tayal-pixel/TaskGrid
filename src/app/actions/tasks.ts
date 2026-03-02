"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

export async function getUserTasks() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return [];
    }

    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
      select: { id: true, role: true },
    });

    if (!user) {
      return [];
    }

    // For Partners, get all tasks; for others, get assigned tasks
    const whereClause = user.role === "PARTNER" 
      ? {} 
      : { assigneeId: user.id };

    const tasks = await prisma.task.findMany({
      where: {
        ...whereClause,
        parentId: null, // Only get parent tasks, not subtasks
        taskType: "TEAM_TASK", // Only show team tasks, not client requests
      },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        project: {
          select: {
            id: true,
            name: true,
            dueDate: true,
            client: {
              select: {
                id: true,
                legalName: true,
                preferredName: true,
              },
            },
            tag: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      taskType: task.taskType,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      project: {
        id: task.project.id,
        name: task.project.name,
        dueDate: task.project.dueDate,
        client: task.project.client ? {
          id: task.project.client.id,
          name: task.project.client.preferredName || task.project.client.legalName,
        } : null,
        tag: task.project.tag,
      },
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: task.assignee.name,
        email: task.assignee.email,
        avatar: task.assignee.avatar,
      } : null,
      subtaskCount: task.subtasks.length,
      completedSubtaskCount: task.subtasks.filter((s) => s.status === "COMPLETED").length,
      commentCount: task._count.comments,
    }));
  } catch (error) {
    console.error("Failed to fetch user tasks:", error);
    return [];
  }
}

export async function getTaskFilters() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { tags: [], clients: [], assignees: [] };
    }

    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
      select: { id: true, role: true },
    });

    if (!user) {
      return { tags: [], clients: [], assignees: [] };
    }

    // Get unique tags
    const tags = await prisma.projectTag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    // Get unique clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        legalName: true,
        preferredName: true,
      },
      orderBy: { legalName: "asc" },
    });

    // Get team members for assignee filter
    const assignees = await prisma.user.findMany({
      where: {
        role: { in: ["PARTNER", "MANAGER", "ASSOCIATE"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      orderBy: { name: "asc" },
    });

    return {
      tags,
      clients: clients.map((c) => ({
        id: c.id,
        name: c.preferredName || c.legalName,
      })),
      assignees,
    };
  } catch (error) {
    console.error("Failed to fetch task filters:", error);
    return { tags: [], clients: [], assignees: [] };
  }
}

// Get task comments
export async function getTaskComments(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return { success: true, comments };
  } catch (error) {
    console.error("Failed to fetch task comments:", error);
    return { success: false, error: "Failed to fetch comments" };
  }
}

// Add task comment
export async function addTaskComment(taskId: string, content: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return { success: true, comment };
  } catch (error) {
    console.error("Failed to add task comment:", error);
    return { success: false, error: "Failed to add comment" };
  }
}

// Get task attachments
export async function getTaskAttachments(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return { success: true, attachments };
  } catch (error) {
    console.error("Failed to fetch task attachments:", error);
    return { success: false, error: "Failed to fetch attachments" };
  }
}

// Add task attachment
export async function addTaskAttachment(
  taskId: string,
  name: string,
  fileUrl: string,
  fileSize?: number,
  mimeType?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const attachment = await prisma.taskAttachment.create({
      data: {
        name,
        fileUrl,
        fileSize,
        mimeType,
        taskId,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return { success: true, attachment };
  } catch (error) {
    console.error("Failed to add task attachment:", error);
    return { success: false, error: "Failed to add attachment" };
  }
}

// Delete task attachment
export async function deleteTaskAttachment(attachmentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete task attachment:", error);
    return { success: false, error: "Failed to delete attachment" };
  }
}
