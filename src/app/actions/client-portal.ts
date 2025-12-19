"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ============================================
// CLIENT PORTAL ACCESS
// ============================================

export async function getClientPortalAccess(clientId: string) {
  try {
    const access = await prisma.clientPortalAccess.findUnique({
      where: { clientId },
    });
    return access;
  } catch (error) {
    console.error("Failed to fetch client portal access:", error);
    return null;
  }
}

export async function createClientPortalAccess(clientId: string) {
  try {
    const access = await prisma.clientPortalAccess.create({
      data: {
        clientId,
        isActive: true,
      },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true, access };
  } catch (error) {
    console.error("Failed to create client portal access:", error);
    return { success: false, error: "Failed to create portal access" };
  }
}

export async function toggleClientPortalAccess(clientId: string, isActive: boolean) {
  try {
    const access = await prisma.clientPortalAccess.update({
      where: { clientId },
      data: { isActive },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true, access };
  } catch (error) {
    console.error("Failed to toggle client portal access:", error);
    return { success: false, error: "Failed to toggle portal access" };
  }
}

export async function regeneratePortalToken(clientId: string) {
  try {
    const access = await prisma.clientPortalAccess.update({
      where: { clientId },
      data: {
        accessToken: `portal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true, access };
  } catch (error) {
    console.error("Failed to regenerate portal token:", error);
    return { success: false, error: "Failed to regenerate token" };
  }
}

// ============================================
// CLIENT REQUESTS
// ============================================

export async function getClientRequests(filters?: {
  clientId?: string;
  projectId?: string;
  status?: string;
  type?: string;
}) {
  try {
    const where: any = {};

    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;

    const requests = await prisma.clientRequest.findMany({
      where,
      include: {
        client: {
          select: { id: true, legalName: true, preferredName: true, primaryEmail: true },
        },
        project: {
          select: { id: true, name: true },
        },
        document: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests;
  } catch (error) {
    console.error("Failed to fetch client requests:", error);
    return [];
  }
}

export async function getPendingClientRequests() {
  try {
    const requests = await prisma.clientRequest.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        client: {
          select: { id: true, legalName: true, preferredName: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    return requests;
  } catch (error) {
    console.error("Failed to fetch pending client requests:", error);
    return [];
  }
}

interface CreateClientRequestInput {
  title: string;
  description?: string;
  type: string;
  clientId: string;
  projectId?: string;
  documentId?: string;
  dueDate?: string;
  createdById: string;
}

export async function createClientRequest(data: CreateClientRequestInput) {
  try {
    const request = await prisma.clientRequest.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type as any,
        clientId: data.clientId,
        projectId: data.projectId || null,
        documentId: data.documentId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: data.createdById,
      },
    });

    revalidatePath("/client-requests");
    revalidatePath(`/clients/${data.clientId}`);
    return { success: true, request };
  } catch (error) {
    console.error("Failed to create client request:", error);
    return { success: false, error: "Failed to create client request" };
  }
}

export async function updateClientRequestStatus(id: string, status: string) {
  try {
    const request = await prisma.clientRequest.update({
      where: { id },
      data: {
        status: status as any,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    revalidatePath("/client-requests");
    return { success: true, request };
  } catch (error) {
    console.error("Failed to update client request status:", error);
    return { success: false, error: "Failed to update request status" };
  }
}

export async function sendClientRequestReminder(id: string) {
  try {
    const request = await prisma.clientRequest.update({
      where: { id },
      data: {
        reminderSent: true,
        reminderCount: { increment: 1 },
        lastReminder: new Date(),
      },
    });

    // TODO: Integrate with email service to send actual reminder
    
    revalidatePath("/client-requests");
    return { success: true, request };
  } catch (error) {
    console.error("Failed to send reminder:", error);
    return { success: false, error: "Failed to send reminder" };
  }
}

export async function deleteClientRequest(id: string) {
  try {
    await prisma.clientRequest.delete({
      where: { id },
    });

    revalidatePath("/client-requests");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete client request:", error);
    return { success: false, error: "Failed to delete client request" };
  }
}

// ============================================
// CLIENT PORTAL VIEW (for client-facing pages)
// ============================================

export async function getClientPortalData(accessToken: string) {
  try {
    const access = await prisma.clientPortalAccess.findUnique({
      where: { accessToken },
      include: {
        client: {
          include: {
            projects: {
              where: { status: { not: "CANCELLED" } },
              orderBy: { dueDate: "asc" },
              include: {
                tasks: {
                  where: { status: { not: "CANCELLED" } },
                  orderBy: { dueDate: "asc" },
                },
              },
            },
            clientRequests: {
              where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
              orderBy: { dueDate: "asc" },
            },
            documents: {
              where: { type: { in: ["NEEDED_FROM_CLIENT", "CREATED_FOR_CLIENT"] } },
              orderBy: { createdAt: "desc" },
            },
            invoices: {
              where: { status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] } },
              orderBy: { dueDate: "asc" },
            },
          },
        },
      },
    });

    if (!access || !access.isActive) {
      return { success: false, error: "Invalid or inactive portal access" };
    }

    // Update last access time
    await prisma.clientPortalAccess.update({
      where: { id: access.id },
      data: { lastAccessAt: new Date() },
    });

    return {
      success: true,
      client: access.client,
    };
  } catch (error) {
    console.error("Failed to fetch client portal data:", error);
    return { success: false, error: "Failed to fetch portal data" };
  }
}

// ============================================
// BULK DOCUMENT REQUESTS
// ============================================

export async function createBulkDocumentRequests(
  clientId: string,
  projectId: string,
  documents: { name: string; description?: string; dueDate?: string }[],
  createdById: string
) {
  try {
    const results = await Promise.all(
      documents.map(async (doc) => {
        // Create document record
        const document = await prisma.document.create({
          data: {
            name: doc.name,
            description: doc.description,
            type: "NEEDED_FROM_CLIENT",
            category: "OTHER",
            status: "REQUESTED",
            clientId,
            projectId,
            dueDate: doc.dueDate ? new Date(doc.dueDate) : null,
          },
        });

        // Create client request
        const request = await prisma.clientRequest.create({
          data: {
            title: `Upload: ${doc.name}`,
            description: doc.description,
            type: "DOCUMENT_UPLOAD",
            clientId,
            projectId,
            documentId: document.id,
            dueDate: doc.dueDate ? new Date(doc.dueDate) : null,
            createdById,
          },
        });

        return { document, request };
      })
    );

    revalidatePath("/client-requests");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, results };
  } catch (error) {
    console.error("Failed to create bulk document requests:", error);
    return { success: false, error: "Failed to create document requests" };
  }
}
