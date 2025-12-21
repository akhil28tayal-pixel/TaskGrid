"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Get all project tags
export async function getProjectTags() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized", tags: [] };
    }

    const tags = await prisma.projectTag.findMany({
      orderBy: { name: "asc" },
    });

    return { success: true, tags };
  } catch (error) {
    console.error("Failed to fetch project tags:", error);
    return { success: false, error: "Failed to fetch tags", tags: [] };
  }
}

// Create a new project tag (Partners only)
export async function createProjectTag(data: { name: string; color: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;

    // Only Partners can create tags
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can create tags" };
    }

    const tag = await prisma.projectTag.create({
      data: {
        name: data.name,
        color: data.color,
      },
    });

    return { success: true, tag };
  } catch (error: any) {
    console.error("Failed to create project tag:", error);
    if (error.code === "P2002") {
      return { success: false, error: "A tag with this name already exists" };
    }
    return { success: false, error: "Failed to create tag" };
  }
}

// Update a project tag (Partners only)
export async function updateProjectTag(
  tagId: string,
  data: { name?: string; color?: string }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;

    // Only Partners can update tags
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can update tags" };
    }

    const tag = await prisma.projectTag.update({
      where: { id: tagId },
      data: {
        name: data.name,
        color: data.color,
      },
    });

    revalidatePath("/projects");
    return { success: true, tag };
  } catch (error: any) {
    console.error("Failed to update project tag:", error);
    if (error.code === "P2002") {
      return { success: false, error: "A tag with this name already exists" };
    }
    return { success: false, error: "Failed to update tag" };
  }
}

// Delete a project tag (Partners only)
export async function deleteProjectTag(tagId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;

    // Only Partners can delete tags
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can delete tags" };
    }

    // First, remove the tag from all projects
    await prisma.project.updateMany({
      where: { tagId },
      data: { tagId: null },
    });

    // Then delete the tag
    await prisma.projectTag.delete({
      where: { id: tagId },
    });

    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete project tag:", error);
    return { success: false, error: "Failed to delete tag" };
  }
}

// Assign a tag to a project (Team members only - not clients)
export async function assignTagToProject(projectId: string, tagId: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Any team member (Partner, Manager, Associate) can assign tags
    // Clients cannot - they don't have access to this action

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { tagId },
      include: {
        tag: true,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, project };
  } catch (error) {
    console.error("Failed to assign tag to project:", error);
    return { success: false, error: "Failed to assign tag" };
  }
}
