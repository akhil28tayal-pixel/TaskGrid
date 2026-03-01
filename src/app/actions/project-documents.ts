"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Get all documents for a project (both team uploads and client uploads)
export async function getProjectDocuments(projectId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch all documents related to this project
    // This includes:
    // 1. Documents directly attached to the project
    // 2. Documents attached to tasks within the project
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { projectId: projectId },
          { 
            task: {
              projectId: projectId
            }
          }
        ]
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            taskType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Also fetch task attachments (team internal files)
    const taskAttachments = await prisma.taskAttachment.findMany({
      where: {
        task: {
          projectId: projectId,
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            taskType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Combine and format the results
    const allFiles = [
      ...documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: 'document' as const,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt,
        uploadedBy: doc.uploadedBy,
        task: doc.task,
        category: doc.category,
        status: doc.status,
        source: doc.uploadedBy?.role ? 'team' : 'client',
      })),
      ...taskAttachments.map(att => ({
        id: att.id,
        name: att.name,
        type: 'attachment' as const,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        createdAt: att.createdAt,
        uploadedBy: att.uploadedBy,
        task: att.task,
        category: null,
        status: null,
        source: 'team' as const,
      })),
    ];

    // Sort by creation date (newest first)
    allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { 
      success: true, 
      files: allFiles,
      stats: {
        total: allFiles.length,
        documents: documents.length,
        attachments: taskAttachments.length,
        teamFiles: allFiles.filter(f => f.source === 'team').length,
        clientFiles: allFiles.filter(f => f.source === 'client').length,
      }
    };
  } catch (error) {
    console.error("Failed to fetch project documents:", error);
    return { success: false, error: "Failed to fetch documents" };
  }
}

// Download a document
export async function downloadProjectDocument(documentId: string, type: 'document' | 'attachment') {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (type === 'document') {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          fileUrl: true,
          name: true,
          mimeType: true,
        },
      });

      if (!document) {
        return { success: false, error: "Document not found" };
      }

      return { success: true, document };
    } else {
      const attachment = await prisma.taskAttachment.findUnique({
        where: { id: documentId },
        select: {
          fileUrl: true,
          name: true,
          mimeType: true,
        },
      });

      if (!attachment) {
        return { success: false, error: "Attachment not found" };
      }

      return { success: true, document: attachment };
    }
  } catch (error) {
    console.error("Failed to download document:", error);
    return { success: false, error: "Failed to download document" };
  }
}
