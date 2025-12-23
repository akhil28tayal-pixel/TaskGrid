"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface TeamUploadDocumentInput {
  taskId: string;
  fileName: string;
  fileData: string; // base64 encoded file
  fileSize: number;
  mimeType: string;
  description?: string;
}

/**
 * Team uploads a document for client to view (SEND_DOCUMENT tasks)
 */
export async function teamUploadDocumentForClient(input: TeamUploadDocumentInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    // Verify the task exists and get project/client info
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
      include: {
        project: {
          select: { clientId: true, id: true },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

      taskId: input.taskId,
      fileName: input.fileName,
      fileSize: input.fileSize,
    });

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: input.fileName,
        description: input.description,
        type: "CREATED_FOR_CLIENT",
        category: "OTHER",
        status: "RECEIVED",
        fileUrl: input.fileData,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        receivedAt: new Date(),
        clientId: task.project?.clientId,
        projectId: task.projectId,
        taskId: input.taskId,
        uploadedById: userId,
      },
    });


    // Create notification for client (only if client exists)
    if (task.project?.clientId) {
      try {
        const clientExists = await prisma.user.findUnique({
          where: { id: task.project.clientId },
        });
        
        if (clientExists) {
          await prisma.notification.create({
            data: {
              userId: task.project.clientId,
              type: "TASK_ASSIGNED",
              title: "New Document Available",
              message: `A new document has been uploaded for you: ${input.fileName}`,
              relatedId: input.taskId,
              relatedType: "TASK",
              actionUrl: "/client-tasks",
            },
          });
        } else {
        }
      } catch (notifError) {
        console.error("⚠️ Failed to create notification (non-critical):", notifError);
        // Continue anyway - document upload succeeded
      }
    }

    revalidatePath("/client-tasks");
    revalidatePath("/client-dashboard");
    revalidatePath(`/projects/${task.projectId}`);

    return { success: true, document };
  } catch (error) {
    console.error("❌ Failed to upload document:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload document";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get team-uploaded documents for a task (visible to client)
 */
export async function getTeamDocumentsForTask(taskId: string) {
  try {
    const documents = await prisma.document.findMany({
      where: {
        taskId: taskId,
        type: "CREATED_FOR_CLIENT",
      },
      include: {
        uploadedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, documents };
  } catch (error) {
    console.error("Failed to fetch team documents:", error);
    return { success: false, error: "Failed to fetch documents", documents: [] };
  }
}

/**
 * Update task with question (for ASK_QUESTION tasks)
 */
export async function updateTaskQuestion(taskId: string, question: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { question },
      include: {
        project: {
          select: { clientId: true, id: true },
        },
      },
    });

    // Create notification for client
    if (task.project?.clientId) {
      await prisma.notification.create({
        data: {
          userId: task.project.clientId,
          type: "TASK_ASSIGNED",
          title: "Question from Team",
          message: `Your team has a question: ${task.title}`,
          relatedId: taskId,
          relatedType: "TASK",
          actionUrl: "/client-tasks",
        },
      });
    }

    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath("/client-tasks");

    return { success: true, task };
  } catch (error) {
    console.error("Failed to update question:", error);
    return { success: false, error: "Failed to update question" };
  }
}

/**
 * Delete team-uploaded document
 */
export async function deleteTeamDocument(documentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { task: true },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    if (document.task?.projectId) {
      revalidatePath(`/projects/${document.task.projectId}`);
    }
    revalidatePath("/client-tasks");


    return { success: true };
  } catch (error) {
    console.error("Failed to delete document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}

/**
 * Client submits answer to question
 */
export async function submitTaskAnswer(taskId: string, answer: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const clientId = (session.user as any)?.clientId;
    if (!clientId) {
      return { success: false, error: "Client ID not found" };
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        answer,
        answeredAt: new Date(),
      },
    });

    revalidatePath("/client-tasks");
    revalidatePath(`/projects/${task.projectId}`);


    return { success: true, task };
  } catch (error) {
    console.error("Failed to submit answer:", error);
    return { success: false, error: "Failed to submit answer" };
  }
}
