"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// ============================================
// TEAM MEMBER MANAGEMENT
// ============================================

export async function getTeamMembers() {
  try {
    const members = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: {
        manager: {
          select: { id: true, name: true, email: true, role: true },
        },
        subordinates: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            tasks: true,
            assignments: true,
          },
        },
      },
    });

    return members;
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return [];
  }
}

export async function getTeamMemberById(id: string) {
  try {
    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, name: true, email: true, role: true },
        },
        subordinates: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignments: {
          include: {
            project: {
              select: { id: true, name: true, status: true },
            },
          },
        },
        tasks: {
          where: { status: { not: "COMPLETED" } },
          take: 10,
          orderBy: { dueDate: "asc" },
        },
      },
    });

    return member;
  } catch (error) {
    console.error("Failed to fetch team member:", error);
    return null;
  }
}

interface CreateTeamMemberInput {
  email: string;
  name: string;
  password: string;
  role: "PARTNER" | "MANAGER" | "ASSOCIATE";
  phone?: string;
  hourlyRate?: number;
  managerId?: string;
}

export async function createTeamMember(data: CreateTeamMemberInput) {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // Validate hierarchy rules
    if (data.role === "PARTNER" && data.managerId) {
      return { success: false, error: "Partner cannot have a manager" };
    }

    if (data.role === "MANAGER" && data.managerId) {
      // Manager can only report to Partner
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId },
      });
      if (manager?.role !== "PARTNER") {
        return { success: false, error: "Manager can only report to a Partner" };
      }
    }

    if (data.role === "ASSOCIATE" && data.managerId) {
      // Associate can report to Manager or Partner
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId },
      });
      if (manager?.role === "ASSOCIATE") {
        return { success: false, error: "Associate cannot report to another Associate" };
      }
    }

    const hashedPassword = await hashPassword(data.password);

    const member = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        phone: data.phone,
        hourlyRate: data.hourlyRate,
        managerId: data.managerId,
      },
    });

    revalidatePath("/team");
    return { success: true, member };
  } catch (error) {
    console.error("Failed to create team member:", error);
    return { success: false, error: "Failed to create team member" };
  }
}

interface UpdateTeamMemberInput {
  name?: string;
  phone?: string;
  hourlyRate?: number;
  role?: "PARTNER" | "MANAGER" | "ASSOCIATE";
  managerId?: string | null;
  isActive?: boolean;
}

export async function updateTeamMember(id: string, data: UpdateTeamMemberInput) {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: { subordinates: true },
    });

    if (!currentUser) {
      return { success: false, error: "Team member not found" };
    }

    // Validate hierarchy rules if role is changing
    if (data.role && data.role !== currentUser.role) {
      // If demoting from Partner/Manager to Associate, ensure no subordinates
      if (data.role === "ASSOCIATE" && currentUser.subordinates.length > 0) {
        return {
          success: false,
          error: "Cannot demote to Associate while having subordinates. Reassign them first.",
        };
      }
    }

    // Validate manager assignment
    if (data.managerId !== undefined) {
      if (data.managerId === id) {
        return { success: false, error: "User cannot be their own manager" };
      }

      if (data.managerId) {
        const newManager = await prisma.user.findUnique({
          where: { id: data.managerId },
        });

        const effectiveRole = data.role || currentUser.role;

        if (effectiveRole === "PARTNER") {
          return { success: false, error: "Partner cannot have a manager" };
        }

        if (effectiveRole === "MANAGER" && newManager?.role !== "PARTNER") {
          return { success: false, error: "Manager can only report to a Partner" };
        }

        if (effectiveRole === "ASSOCIATE" && newManager?.role === "ASSOCIATE") {
          return { success: false, error: "Associate cannot report to another Associate" };
        }
      }
    }

    const member = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        hourlyRate: data.hourlyRate,
        role: data.role,
        managerId: data.managerId,
        isActive: data.isActive,
      },
    });

    revalidatePath("/team");
    return { success: true, member };
  } catch (error) {
    console.error("Failed to update team member:", error);
    return { success: false, error: "Failed to update team member" };
  }
}

export async function resetPassword(id: string, newPassword: string) {
  try {
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

export async function deactivateTeamMember(id: string) {
  try {
    // Check if user has active assignments
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subordinates: true,
        tasks: { where: { status: { not: "COMPLETED" } } },
      },
    });

    if (!user) {
      return { success: false, error: "Team member not found" };
    }

    if (user.subordinates.length > 0) {
      return {
        success: false,
        error: "Cannot deactivate user with subordinates. Reassign them first.",
      };
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to deactivate team member:", error);
    return { success: false, error: "Failed to deactivate team member" };
  }
}

export async function reactivateTeamMember(id: string) {
  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to reactivate team member:", error);
    return { success: false, error: "Failed to reactivate team member" };
  }
}

// Get team hierarchy for display
export async function getTeamHierarchy() {
  try {
    // Get all partners (top level)
    const partners = await prisma.user.findMany({
      where: { role: "PARTNER", isActive: true },
      include: {
        subordinates: {
          where: { isActive: true },
          include: {
            subordinates: {
              where: { isActive: true },
              select: { id: true, name: true, email: true, role: true, avatar: true },
            },
          },
        },
      },
    });

    return partners;
  } catch (error) {
    console.error("Failed to fetch team hierarchy:", error);
    return [];
  }
}

// Get managers for dropdown (for assigning to associates)
export async function getManagers() {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ["PARTNER", "MANAGER"] },
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return managers;
  } catch (error) {
    console.error("Failed to fetch managers:", error);
    return [];
  }
}

// Get partners for dropdown (for assigning managers)
export async function getPartners() {
  try {
    const partners = await prisma.user.findMany({
      where: {
        role: "PARTNER",
        isActive: true,
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    return partners;
  } catch (error) {
    console.error("Failed to fetch partners:", error);
    return [];
  }
}
