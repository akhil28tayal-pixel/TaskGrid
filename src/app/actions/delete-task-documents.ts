"use server";

import { prisma } from "@/lib/prisma";

/**
 * Delete all documents associated with a task
 * Called when a CLIENT_REQUEST task is deleted
 */
export async function deleteTaskDocuments(taskId: string) {
  try {
    // Get the task to find its project
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Delete all documents that were uploaded for this task
    // Documents are linked by projectId and receivedAt (client uploads)
    const result = await prisma.document.deleteMany({
      where: {
        projectId: task.projectId,
        type: "RECEIVED_FROM_CLIENT",
      },
    });


    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error("Failed to delete task documents:", error);
    return { success: false, error: "Failed to delete documents" };
  }
}
