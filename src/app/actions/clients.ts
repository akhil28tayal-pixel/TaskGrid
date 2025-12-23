"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendClientPortalInvite } from "@/lib/email";

// Types matching the form data
interface ShareholderInput {
  name: string;
  sin: string;
  classOfShares: string;
  percentageHolding: string;
}

interface CreateClientInput {
  clientType: string;
  legalName: string;
  preferredName: string;
  entityType: string;
  taxId: string;
  dateOfIncorporation: string;
  primaryEmail: string;
  primaryPhone: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  mailingCountry: string;
  billingAddressSame: boolean;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
  servicesRequired: string[];
  engagementStartDate: string;
  primaryAccountManager: string;
  billingPreference: string;
  onboardingStatus: string;
  shareholders: ShareholderInput[];
  accountingSoftware: string;
  fiscalYearStartMonth: number;
  tags: string[];
  internalNotes: string;
  riskRating: string;
}

export async function createClient(data: CreateClientInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    
    // Only Partners and Managers can create clients
    if (userRole === "ASSOCIATE") {
      return { success: false, error: "Associates cannot create clients" };
    }

    // Partners create clients directly (approved), Managers create pending clients
    const approvalStatus = userRole === "PARTNER" ? "APPROVED" : "PENDING";

    const client = await prisma.client.create({
      data: {
        clientType: data.clientType as any,
        legalName: data.legalName,
        preferredName: data.preferredName || null,
        entityType: data.entityType ? (data.entityType as any) : null,
        taxId: data.taxId || null,
        dateOfIncorporation: data.dateOfIncorporation ? new Date(data.dateOfIncorporation) : null,
        primaryEmail: data.primaryEmail,
        primaryPhone: data.primaryPhone || null,
        mailingStreet: data.mailingStreet || null,
        mailingCity: data.mailingCity || null,
        mailingState: data.mailingState || null,
        mailingZip: data.mailingZip || null,
        mailingCountry: data.mailingCountry || null,
        billingAddressSame: data.billingAddressSame,
        billingStreet: data.billingAddressSame ? null : data.billingStreet || null,
        billingCity: data.billingAddressSame ? null : data.billingCity || null,
        billingState: data.billingAddressSame ? null : data.billingState || null,
        billingZip: data.billingAddressSame ? null : data.billingZip || null,
        billingCountry: data.billingAddressSame ? null : data.billingCountry || null,
        servicesRequired: data.servicesRequired as any[],
        engagementStartDate: data.engagementStartDate ? new Date(data.engagementStartDate) : null,
        primaryAccountManager: data.primaryAccountManager || null,
        billingPreference: data.billingPreference as any,
        onboardingStatus: data.onboardingStatus as any,
        accountingSoftware: data.accountingSoftware ? (data.accountingSoftware as any) : null,
        fiscalYearStartMonth: data.fiscalYearStartMonth,
        tags: data.tags,
        internalNotes: data.internalNotes || null,
        riskRating: data.riskRating ? (data.riskRating as any) : null,
        status: "ACTIVE",
        approvalStatus: approvalStatus as any,
        createdById: userId,
        approvedById: userRole === "PARTNER" ? userId : null,
        approvedAt: userRole === "PARTNER" ? new Date() : null,
      },
    });

    // Create shareholders if provided
    if (data.shareholders && data.shareholders.length > 0) {
      await prisma.shareholder.createMany({
        data: data.shareholders.map(sh => ({
          clientId: client.id,
          name: sh.name,
          sin: sh.sin || null,
          classOfShares: sh.classOfShares || null,
          percentageHolding: sh.percentageHolding ? parseFloat(sh.percentageHolding) : null,
        })),
      });
    }

    // Auto-create client portal access with password setup token
    const passwordSetupToken = `setup_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const passwordSetupExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const portalAccess = await prisma.clientPortalAccess.create({
      data: {
        clientId: client.id,
        email: data.primaryEmail,
        passwordSetupToken,
        passwordSetupExpiry,
        isActive: true,
      },
    });

    // Send email to client with password setup link
    const setupLink = `${process.env.NEXTAUTH_URL}/client-setup-password?token=${passwordSetupToken}`;
    const clientName = data.preferredName || data.legalName;
    
    // Send the invitation email
    const emailResult = await sendClientPortalInvite(data.primaryEmail, clientName, setupLink);
    if (!emailResult.success) {
      console.warn("Failed to send portal invite email, but client was created:", emailResult.error);
    }
    console.log(`📧 Client portal setup link for ${data.primaryEmail}: ${setupLink}`);
    
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    
    const message = userRole === "PARTNER" 
      ? "Client created successfully. Portal access invitation sent." 
      : "Client submitted for Partner approval";
    
    return { 
      success: true, 
      client, 
      message, 
      needsApproval: userRole !== "PARTNER",
      portalSetupLink: setupLink,
    };
  } catch (error) {
    console.error("Failed to create client:", error);
    return { success: false, error: "Failed to create client" };
  }
}

export async function getClients() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return [];
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    let whereClause = {};

    // Role-based filtering
    if (userRole === "PARTNER") {
      // Partner sees all clients
      whereClause = {};
    } else if (userRole === "MANAGER") {
      // Manager sees clients from projects they or their subordinates are assigned to
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      const teamIds = [userId, ...subordinates.map((s) => s.id)];

      whereClause = {
        projects: {
          some: {
            assignments: {
              some: {
                userId: { in: teamIds },
              },
            },
          },
        },
      };
    } else if (userRole === "ASSOCIATE") {
      // Associate sees only clients from projects they are assigned to
      whereClause = {
        projects: {
          some: {
            assignments: {
              some: {
                userId: userId,
              },
            },
          },
        },
      };
    }

    // Partner sees all clients (including pending)
    // Manager sees approved clients + their own pending clients
    // Associate sees only approved clients they're assigned to
    let clients;
    
    if (userRole === "PARTNER") {
      // Partner sees all clients
      clients = await prisma.client.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { projects: true },
          },
        },
      });
    } else if (userRole === "MANAGER") {
      // Manager sees approved clients from their projects + their own pending clients
      const [approvedClients, pendingClients] = await Promise.all([
        prisma.client.findMany({
          where: { ...whereClause, approvalStatus: "APPROVED" as any },
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { projects: true },
            },
          },
        }),
        prisma.client.findMany({
          where: { createdById: userId, approvalStatus: "PENDING" as any },
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { projects: true },
            },
          },
        }),
      ]);
      
      // Combine and deduplicate
      const clientIds = new Set<string>();
      clients = [];
      for (const client of [...pendingClients, ...approvedClients]) {
        if (!clientIds.has(client.id)) {
          clientIds.add(client.id);
          clients.push(client);
        }
      }
    } else {
      // Associate sees only approved clients
      clients = await prisma.client.findMany({
        where: { ...whereClause, approvalStatus: "APPROVED" as any },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { projects: true },
          },
        },
      });
    }

    return clients.map((client: any) => ({
      id: client.id,
      name: client.preferredName || client.legalName,
      email: client.primaryEmail,
      phone: client.primaryPhone || "",
      company: client.clientType === "INDIVIDUAL" ? "" : client.legalName,
      status: client.status,
      approvalStatus: client.approvalStatus,
      activeProjects: client._count.projects,
      totalProjects: client._count.projects,
    }));
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return [];
  }
}

export async function getClientById(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        projects: {
          orderBy: { createdAt: "desc" },
          include: {
            tasks: {
              orderBy: { dueDate: "asc" },
            },
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        contacts: true,
      },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // Calculate summary stats
    const openTasks = client.projects.flatMap(p => p.tasks).filter(t => t.status !== "COMPLETED" && t.status !== "CANCELLED");
    const upcomingDeadlines = openTasks
      .filter(t => t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 3);
    
    const pendingDocs = client.documents.filter(d => d.status === "PENDING" || d.status === "REQUESTED");
    const receivedDocs = client.documents.filter(d => d.status === "RECEIVED" || d.status === "APPROVED");

    return {
      success: true,
      client: {
        ...client,
        stats: {
          openTasksCount: openTasks.length,
          pendingDocsCount: pendingDocs.length,
          receivedDocsCount: receivedDocs.length,
          totalProjects: client.projects.length,
          activeProjects: client.projects.filter(p => p.status !== "COMPLETED" && p.status !== "CANCELLED").length,
        },
        upcomingDeadlines: upcomingDeadlines.map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          status: t.status,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to fetch client:", error);
    return { success: false, error: "Failed to fetch client" };
  }
}

export async function deleteClient(clientId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    
    // Only Partners can delete clients
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can delete clients" };
    }

    await prisma.client.delete({
      where: { id: clientId },
    });
    
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete client:", error);
    return { success: false, error: "Failed to delete client" };
  }
}

export async function updateClient(clientId: string, data: Partial<CreateClientInput>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    
    // Only Partners can edit clients
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can edit clients" };
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        clientType: data.clientType as any,
        legalName: data.legalName,
        preferredName: data.preferredName || null,
        entityType: data.entityType ? (data.entityType as any) : null,
        taxId: data.taxId || null,
        dateOfIncorporation: data.dateOfIncorporation ? new Date(data.dateOfIncorporation) : null,
        primaryEmail: data.primaryEmail,
        primaryPhone: data.primaryPhone || null,
        mailingStreet: data.mailingStreet || null,
        mailingCity: data.mailingCity || null,
        mailingState: data.mailingState || null,
        mailingZip: data.mailingZip || null,
        mailingCountry: data.mailingCountry || null,
        billingAddressSame: data.billingAddressSame,
        billingStreet: data.billingAddressSame ? null : data.billingStreet || null,
        billingCity: data.billingAddressSame ? null : data.billingCity || null,
        billingState: data.billingAddressSame ? null : data.billingState || null,
        billingZip: data.billingAddressSame ? null : data.billingZip || null,
        billingCountry: data.billingAddressSame ? null : data.billingCountry || null,
        servicesRequired: data.servicesRequired as any[],
        engagementStartDate: data.engagementStartDate ? new Date(data.engagementStartDate) : null,
        primaryAccountManager: data.primaryAccountManager || null,
        billingPreference: data.billingPreference as any,
        onboardingStatus: data.onboardingStatus as any,
        accountingSoftware: data.accountingSoftware ? (data.accountingSoftware as any) : null,
        fiscalYearStartMonth: data.fiscalYearStartMonth,
        tags: data.tags,
        internalNotes: data.internalNotes || null,
        riskRating: data.riskRating ? (data.riskRating as any) : null,
      },
    });

    // Update shareholders if provided
    if (data.shareholders) {
      // Delete existing shareholders
      await prisma.shareholder.deleteMany({
        where: { clientId },
      });
      
      // Create new shareholders
      if (data.shareholders.length > 0) {
        await prisma.shareholder.createMany({
          data: data.shareholders.map(sh => ({
            clientId,
            name: sh.name,
            sin: sh.sin || null,
            classOfShares: sh.classOfShares || null,
            percentageHolding: sh.percentageHolding ? parseFloat(sh.percentageHolding) : null,
          })),
        });
      }
    }
    
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    return { success: true, client };
  } catch (error) {
    console.error("Failed to update client:", error);
    return { success: false, error: "Failed to update client" };
  }
}

// Get pending clients for Partner approval
export async function getPendingClients() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return [];
    }

    const userRole = (session.user as any).role;
    
    // Only Partners can see pending clients
    if (userRole !== "PARTNER") {
      return [];
    }

    const clients = await prisma.client.findMany({
      where: { approvalStatus: "PENDING" as any },
      orderBy: { createdAt: "desc" },
    });
    
    return clients.map((client) => ({
      id: client.id,
      name: client.preferredName || client.legalName,
      email: client.primaryEmail,
      phone: client.primaryPhone || "",
      company: client.clientType === "INDIVIDUAL" ? "" : client.legalName,
      createdAt: client.createdAt,
      createdById: client.createdById,
    }));
  } catch (error) {
    console.error("Failed to fetch pending clients:", error);
    return [];
  }
}

// Approve a pending client
export async function approveClient(clientId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    
    // Only Partners can approve clients
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can approve clients" };
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        approvalStatus: "APPROVED",
        approvedById: userId,
        approvedAt: new Date(),
      },
    });
    
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return { success: true, client };
  } catch (error) {
    console.error("Failed to approve client:", error);
    return { success: false, error: "Failed to approve client" };
  }
}

// Reject a pending client
export async function rejectClient(clientId: string, reason: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    
    // Only Partners can reject clients
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can reject clients" };
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        approvalStatus: "REJECTED",
        rejectionReason: reason,
      },
    });
    
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return { success: true, client };
  } catch (error) {
    console.error("Failed to reject client:", error);
    return { success: false, error: "Failed to reject client" };
  }
}
