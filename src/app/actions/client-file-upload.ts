"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface UploadFileToTaskInput {
  taskId: string;
  fileName: string;
  fileData: string; // base64 encoded file
  fileSize: number;
  mimeType: string;
}

/**
 * Upload a file from client portal to a task
 * This creates a Document record and links it to the task
 */
export async function uploadFileToTask(input: UploadFileToTaskInput) {
  try {
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("❌ Upload failed: No session");
      return { success: false, error: "Unauthorized" };
    }

    const clientId = (session.user as any)?.clientId;
    if (!clientId) {
      console.error("❌ Upload failed: No client ID in session");
      return { success: false, error: "Client ID not found" };
    }


    // Verify the task belongs to this client
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
      include: {
        project: {
          select: { clientId: true },
        },
      },
    });

    if (!task) {
      console.error("❌ Task not found:", input.taskId);
      return { success: false, error: "Task not found" };
    }

    if (task.project?.clientId !== clientId) {
      console.error("❌ Access denied. Task client:", task.project?.clientId, "User client:", clientId);
      return { success: false, error: "Access denied" };
    }


    // Create document record
    const document = await prisma.document.create({
      data: {
        name: input.fileName,
        type: "RECEIVED_FROM_CLIENT",
        category: "OTHER",
        status: "RECEIVED",
        fileUrl: input.fileData, // Store base64 data (in production, upload to S3/cloud storage)
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        receivedAt: new Date(),
        clientId: clientId,
        projectId: task.projectId,
        taskId: input.taskId, // Link document to specific task
      },
    });


    // Note: Task completion is handled by team members, not automatically on upload

    // Note: Activity log requires a User ID, not Client ID
    // Client uploads are tracked via the Document record instead

    revalidatePath("/client-tasks");
    revalidatePath("/client-dashboard");


    return { success: true, document };
  } catch (error) {
    console.error("❌ Failed to upload file - Full error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get documents uploaded by client for a specific task
 */
export async function getTaskDocuments(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized", documents: [] };
    }

    const documents = await prisma.document.findMany({
      where: {
        taskId: taskId,
        type: "RECEIVED_FROM_CLIENT",
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, documents };
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return { success: false, error: "Failed to fetch documents", documents: [] };
  }
}

/**
 * Download a document (for team members)
 */
export async function downloadDocument(documentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    return {
      success: true,
      document: {
        name: document.name,
        fileUrl: document.fileUrl,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
      },
    };
  } catch (error) {
    console.error("Failed to download document:", error);
    return { success: false, error: "Failed to download document" };
  }
}
