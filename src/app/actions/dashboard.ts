"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Helper to get role-based project filter
async function getRoleBasedProjectFilter() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { id: "none" }; // Return impossible filter

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  if (userRole === "PARTNER") {
    return {}; // No filter - see all
  } else if (userRole === "MANAGER") {
    const subordinates = await prisma.user.findMany({
      where: { managerId: userId },
      select: { id: true },
    });
    const teamIds = [userId, ...subordinates.map((s) => s.id)];
    return {
      assignments: {
        some: {
          userId: { in: teamIds },
        },
      },
    };
  } else {
    // ASSOCIATE
    return {
      assignments: {
        some: {
          userId: userId,
        },
      },
    };
  }
}

// Helper to get role-based client filter
async function getRoleBasedClientFilter() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { id: "none" };

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  if (userRole === "PARTNER") {
    return {};
  } else if (userRole === "MANAGER") {
    const subordinates = await prisma.user.findMany({
      where: { managerId: userId },
      select: { id: true },
    });
    const teamIds = [userId, ...subordinates.map((s) => s.id)];
    return {
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
  } else {
    return {
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
}

export async function getDashboardStats() {
  try {
    const now = new Date();
    const projectFilter = await getRoleBasedProjectFilter();
    const clientFilter = await getRoleBasedClientFilter();
    
    const [
      activeClients,
      activeProjects,
      pendingDocs,
      dueThisWeek,
    ] = await Promise.all([
      prisma.client.count({ where: { ...clientFilter, status: "ACTIVE" } }),
      prisma.project.count({
        where: { ...projectFilter, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      }),
      prisma.document.count({ where: { status: "PENDING" } }),
      prisma.project.count({
        where: {
          ...projectFilter,
          dueDate: {
            gte: now,
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
      }),
    ]);

    return {
      activeClients,
      activeProjects,
      pendingDocs,
      dueThisWeek,
      pendingRequests: 0,
      overdueInvoices: 0,
      monthlyRevenue: 0,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      activeClients: 0,
      activeProjects: 0,
      pendingDocs: 0,
      dueThisWeek: 0,
      pendingRequests: 0,
      overdueInvoices: 0,
      monthlyRevenue: 0,
    };
  }
}

export async function getDashboardStatsLegacy() {
  try {
    const [activeClients, activeProjects, pendingDocs, dueThisWeek] = await Promise.all([
      // Count active clients
      prisma.client.count({
        where: { status: "ACTIVE" },
      }),
      // Count active projects (not completed or cancelled)
      prisma.project.count({
        where: {
          status: {
            notIn: ["COMPLETED", "CANCELLED"],
          },
        },
      }),
      // Count pending documents
      prisma.document.count({
        where: {
          status: "PENDING",
        },
      }),
      // Count projects due this week
      prisma.project.count({
        where: {
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          status: {
            notIn: ["COMPLETED", "CANCELLED"],
          },
        },
      }),
    ]);

    return {
      activeClients,
      activeProjects,
      pendingDocs,
      dueThisWeek,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      activeClients: 0,
      activeProjects: 0,
      pendingDocs: 0,
      dueThisWeek: 0,
    };
  }
}

export async function getRecentProjects() {
  try {
    const projectFilter = await getRoleBasedProjectFilter();
    
    const projects = await prisma.project.findMany({
      where: projectFilter,
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        client: true,
        tasks: true,
      },
    });

    return projects.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        client: (project.client as any).preferredName || (project.client as any).legalName || "Unknown",
        status: project.status,
        progress,
        dueDate: project.dueDate
          ? new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "No due date",
      };
    });
  } catch (error) {
    console.error("Failed to fetch recent projects:", error);
    return [];
  }
}

export async function getPendingDocuments() {
  try {
    const documents = await prisma.document.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: new Date(),
        },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: {
        client: true,
      },
    });

    return documents.map((doc) => {
      const daysOverdue = doc.dueDate
        ? Math.floor((Date.now() - new Date(doc.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: doc.id,
        name: doc.name,
        client: (doc.client as any)?.preferredName || (doc.client as any)?.legalName || "Unknown",
        daysOverdue,
      };
    });
  } catch (error) {
    console.error("Failed to fetch pending documents:", error);
    return [];
  }
}

export async function getUpcomingDeadlines() {
  try {
    const projectFilter = await getRoleBasedProjectFilter();
    
    const projects = await prisma.project.findMany({
      where: {
        ...projectFilter,
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Next 2 weeks
        },
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: {
        client: true,
      },
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      client: (project.client as any).preferredName || (project.client as any).legalName || "Unknown",
      date: project.dueDate
        ? new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "",
    }));
  } catch (error) {
    console.error("Failed to fetch upcoming deadlines:", error);
    return [];
  }
}
