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
    // Get client email
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { primaryEmail: true },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    const access = await prisma.clientPortalAccess.create({
      data: {
        clientId,
        email: client.primaryEmail,
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

// ============================================
// PASSWORD SETUP
// ============================================

import bcrypt from "bcryptjs";

export async function verifyPasswordSetupToken(token: string) {
  try {
    const portalAccess = await prisma.clientPortalAccess.findUnique({
      where: { passwordSetupToken: token },
    });

    if (!portalAccess) {
      return { success: false, error: "Invalid setup link." };
    }

    if (portalAccess.passwordSetupExpiry && new Date() > portalAccess.passwordSetupExpiry) {
      return { success: false, error: "Setup link has expired. Please contact your account manager." };
    }

    if (portalAccess.password) {
      return { success: false, error: "Password has already been set. Please log in." };
    }

    return { success: true, email: portalAccess.email };
  } catch (error) {
    console.error("Failed to verify password setup token:", error);
    return { success: false, error: "Failed to verify setup link." };
  }
}

export async function setupClientPassword(token: string, password: string) {
  try {
    const portalAccess = await prisma.clientPortalAccess.findUnique({
      where: { passwordSetupToken: token },
    });

    if (!portalAccess) {
      return { success: false, error: "Invalid setup link." };
    }

    if (portalAccess.passwordSetupExpiry && new Date() > portalAccess.passwordSetupExpiry) {
      return { success: false, error: "Setup link has expired. Please contact your account manager." };
    }

    if (portalAccess.password) {
      return { success: false, error: "Password has already been set." };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the portal access with the new password and clear the setup token
    await prisma.clientPortalAccess.update({
      where: { id: portalAccess.id },
      data: {
        password: hashedPassword,
        passwordSetupToken: null,
        passwordSetupExpiry: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to setup client password:", error);
    return { success: false, error: "Failed to set password." };
  }
}

export async function resendPasswordSetupEmail(clientId: string) {
  try {
    const portalAccess = await prisma.clientPortalAccess.findUnique({
      where: { clientId },
      include: { client: true },
    });

    if (!portalAccess) {
      return { success: false, error: "Portal access not found." };
    }

    if (portalAccess.password) {
      return { success: false, error: "Password has already been set." };
    }

    // Generate new token
    const passwordSetupToken = `setup_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const passwordSetupExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.clientPortalAccess.update({
      where: { id: portalAccess.id },
      data: {
        passwordSetupToken,
        passwordSetupExpiry,
      },
    });

    const setupLink = `${process.env.NEXTAUTH_URL}/client-setup-password?token=${passwordSetupToken}`;
    
    // TODO: Send actual email

    return { success: true, setupLink };
  } catch (error) {
    console.error("Failed to resend password setup email:", error);
    return { success: false, error: "Failed to resend setup email." };
  }
}

// ============================================
// CLIENT DASHBOARD DATA
// ============================================

export async function getClientDashboardData(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        projects: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { dueDate: "asc" },
          include: {
            tasks: {
              where: { parentId: null },
            },
          },
        },
        clientRequests: {
          where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
          orderBy: { dueDate: "asc" },
          include: {
            project: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // Fetch tasks assigned to client (CLIENT_REQUEST type with notification sent)
    const clientTasks = await prisma.task.findMany({
      where: {
        taskType: "CLIENT_REQUEST",
        clientNotificationSentAt: { not: null },
        project: {
          clientId: clientId,
        },
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
      orderBy: { clientNotificationSentAt: "desc" },
      include: {
        project: {
          select: { name: true },
        },
      },
      take: 5,
    });

    // Calculate project progress
    const projectsWithProgress = client.projects
      .filter((p) => p.status !== "COMPLETED")
      .map((project) => {
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(
          (t) => t.status === "COMPLETED"
        ).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          dueDate: project.dueDate,
          progress,
        };
      });

    // Format requests
    const requests = client.clientRequests.map((req) => ({
      id: req.id,
      title: req.title,
      type: req.type,
      status: req.status,
      dueDate: req.dueDate,
      projectName: req.project?.name || null,
    }));

    // Format client tasks
    const tasks = clientTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      projectName: task.project?.name || null,
      notificationSentAt: task.clientNotificationSentAt,
    }));

    // Calculate stats
    const stats = {
      activeProjects: client.projects.filter(
        (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
      ).length,
      pendingRequests: client.clientRequests.length,
      completedProjects: client.projects.filter(
        (p) => p.status === "COMPLETED"
      ).length,
      pendingTasks: clientTasks.length,
    };

    return {
      success: true,
      data: {
        clientName: client.preferredName || client.legalName,
        projects: projectsWithProgress,
        requests,
        tasks,
        stats,
      },
    };
  } catch (error) {
    console.error("Failed to fetch client dashboard data:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}

// ============================================
// CLIENT TASKS
// ============================================

export async function getClientTasks(clientId: string) {
  try {
    // Fetch client requests (legacy)
    const clientRequests = await prisma.clientRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    // Fetch tasks that have been sent to the client (CLIENT_REQUEST type with notification sent)
    const projectTasks = await prisma.task.findMany({
      where: {
        taskType: "CLIENT_REQUEST",
        clientNotificationSentAt: { not: null },
        project: {
          clientId: clientId,
        },
      },
      orderBy: { clientNotificationSentAt: "desc" },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    // Combine both sources
    const tasksFromRequests = clientRequests.map((req) => ({
      id: req.id,
      title: req.title,
      description: req.description,
      status: req.status,
      dueDate: req.dueDate?.toISOString() || null,
      type: req.type,
      projectName: req.project?.name || null,
      notificationSentAt: null,
      source: "client_request" as const,
    }));

    const tasksFromProjects = projectTasks.map((task) => {
      // Determine request type based on task title/description
      let requestType = "DOCUMENT_UPLOAD"; // default
      const titleLower = task.title.toLowerCase();
      
      if (titleLower.includes("upload") || titleLower.includes("submit") || titleLower.includes("provide")) {
        requestType = "DOCUMENT_UPLOAD";
      } else if (titleLower.includes("question") || titleLower.includes("answer") || titleLower.includes("what") || titleLower.includes("how")) {
        requestType = "ASK_QUESTION";
      } else if (titleLower.includes("review") || titleLower.includes("check") || titleLower.includes("view")) {
        requestType = "SEND_DOCUMENT";
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate?.toISOString() || null,
        type: requestType,
        projectName: task.project?.name || null,
        notificationSentAt: task.clientNotificationSentAt?.toISOString() || null,
        source: "project_task" as const,
        question: task.question || null,
        answer: task.answer || null,
      };
    });

    const allTasks = [...tasksFromProjects, ...tasksFromRequests];

    return { success: true, tasks: allTasks };
  } catch (error) {
    console.error("Failed to fetch client tasks:", error);
    return { success: false, error: "Failed to fetch tasks" };
  }
}

// ============================================
// CLIENT DOCUMENTS
// ============================================

export async function getClientDocuments(clientId: string) {
  try {
    const documents = await prisma.document.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    const formattedDocs = documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "N/A",
      uploadedAt: doc.createdAt.toISOString(),
      projectName: doc.project?.name || null,
    }));

    return { success: true, documents: formattedDocs };
  } catch (error) {
    console.error("Failed to fetch client documents:", error);
    return { success: false, error: "Failed to fetch documents" };
  }
}

// ============================================
// CLIENT BILLING
// ============================================

export async function getClientBilling(clientId: string) {
  try {
    // For now, return empty data as billing/invoices may not be implemented yet
    // This can be extended when Invoice model is added
    return {
      success: true,
      invoices: [],
      stats: {
        totalDue: 0,
        totalPaid: 0,
        pendingInvoices: 0,
      },
    };
  } catch (error) {
    console.error("Failed to fetch client billing:", error);
    return { success: false, error: "Failed to fetch billing data" };
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
