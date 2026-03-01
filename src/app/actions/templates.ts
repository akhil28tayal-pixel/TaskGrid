"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Types for template creation
interface CreateTemplateInput {
  name: string;
  description?: string;
  clientIds?: string[];
}

interface CreateSectionInput {
  name: string;
  order: number;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  order: number;
  taskType: "TEAM_TASK" | "CLIENT_REQUEST";
  isRequired?: boolean;
  daysOffset?: number;
}

interface CreateSubtaskInput {
  title: string;
  order: number;
  isRequired?: boolean;
}

interface CreateAutomationInput {
  trigger: "TASK_COMPLETED";
  action: "CHANGE_PROJECT_TAG" | "SEND_EMAIL_TO_CLIENT" | "CREATE_PROJECT";
  actionData?: any;
}

// Create a new workflow template (Partner only)
export async function createWorkflowTemplate(data: CreateTemplateInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can create templates" };
    }

    // Get user by email to ensure we have the correct database ID
    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const template = await prisma.workflowTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        createdById: user.id,
      },
    });

    // If clientIds are provided, create projects for each client
    if (data.clientIds && data.clientIds.length > 0) {
      for (const clientId of data.clientIds) {
        await prisma.project.create({
          data: {
            name: data.name,
            description: data.description,
            type: "OTHER",
            priority: "MEDIUM",
            clientId: clientId,
            status: "NOT_STARTED",
            templateId: template.id,
          },
        });
      }
      revalidatePath("/projects");
    }

    revalidatePath("/workflows");
    return { success: true, template };
  } catch (error: any) {
    console.error("Failed to create template:", error);
    return { success: false, error: error?.message || "Failed to create template" };
  }
}

// Get all workflow templates
export async function getWorkflowTemplates() {
  try {
    const templates = await prisma.workflowTemplate.findMany({
      where: { isActive: true },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
              include: {
                subtasks: { orderBy: { order: "asc" } },
                automations: true,
                attachments: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return templates;
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return [];
  }
}

// Get a single template by ID
export async function getWorkflowTemplateById(templateId: string) {
  try {
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: templateId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
              include: {
                subtasks: { orderBy: { order: "asc" } },
                automations: true,
                attachments: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return template;
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return null;
  }
}

// Update template basic info
export async function updateWorkflowTemplate(
  templateId: string,
  data: { name?: string; description?: string }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can update templates" };
    }

    const template = await prisma.workflowTemplate.update({
      where: { id: templateId },
      data,
    });

    revalidatePath("/workflows");
    revalidatePath(`/workflows/${templateId}`);
    return { success: true, template };
  } catch (error: any) {
    console.error("Failed to update template:", error);
    return { success: false, error: error?.message || "Failed to update template" };
  }
}

// Delete a template (soft delete by setting isActive to false)
export async function deleteWorkflowTemplate(templateId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can delete templates" };
    }

    await prisma.workflowTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });

    revalidatePath("/workflows");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete template:", error);
    return { success: false, error: error?.message || "Failed to delete template" };
  }
}

// ============ SECTION OPERATIONS ============

// Add a section to a template
export async function addTemplateSection(templateId: string, data: CreateSectionInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const section = await prisma.workflowTemplateSection.create({
      data: {
        name: data.name,
        order: data.order,
        templateId,
      },
    });

    revalidatePath(`/workflows/${templateId}`);
    return { success: true, section };
  } catch (error: any) {
    console.error("Failed to add section:", error);
    return { success: false, error: error?.message || "Failed to add section" };
  }
}

// Update a section
export async function updateTemplateSection(
  sectionId: string,
  data: { name?: string; order?: number }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const section = await prisma.workflowTemplateSection.update({
      where: { id: sectionId },
      data,
      include: { template: { select: { id: true } } },
    });

    revalidatePath(`/workflows/${section.template.id}`);
    return { success: true, section };
  } catch (error: any) {
    console.error("Failed to update section:", error);
    return { success: false, error: error?.message || "Failed to update section" };
  }
}

// Delete a section
export async function deleteTemplateSection(sectionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const section = await prisma.workflowTemplateSection.delete({
      where: { id: sectionId },
      include: { template: { select: { id: true } } },
    });

    revalidatePath(`/workflows/${section.template.id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete section:", error);
    return { success: false, error: error?.message || "Failed to delete section" };
  }
}

// Duplicate a section
export async function duplicateTemplateSection(sectionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    // Get the original section with all its tasks and subtasks
    const originalSection = await prisma.workflowTemplateSection.findUnique({
      where: { id: sectionId },
      include: {
        tasks: {
          include: {
            subtasks: true,
            automations: true,
          },
        },
      },
    });

    if (!originalSection) {
      return { success: false, error: "Section not found" };
    }

    // Get the max order for sections in this template
    const maxOrder = await prisma.workflowTemplateSection.aggregate({
      where: { templateId: originalSection.templateId },
      _max: { order: true },
    });

    // Create the duplicated section
    const newSection = await prisma.workflowTemplateSection.create({
      data: {
        name: `${originalSection.name} (Copy)`,
        order: (maxOrder._max.order || 0) + 1,
        templateId: originalSection.templateId,
        tasks: {
          create: originalSection.tasks.map((task) => ({
            title: task.title,
            description: task.description,
            order: task.order,
            taskType: task.taskType,
            isRequired: task.isRequired,
            daysOffset: task.daysOffset,
            subtasks: {
              create: task.subtasks.map((subtask) => ({
                title: subtask.title,
                order: subtask.order,
                isRequired: subtask.isRequired,
              })),
            },
            automations: {
              create: task.automations.map((automation) => ({
                trigger: automation.trigger,
                action: automation.action,
                actionData: automation.actionData ?? undefined,
              })),
            },
          })),
        },
      },
    });

    revalidatePath(`/workflows/${originalSection.templateId}`);
    return { success: true, section: newSection };
  } catch (error: any) {
    console.error("Failed to duplicate section:", error);
    return { success: false, error: error?.message || "Failed to duplicate section" };
  }
}

// ============ TASK OPERATIONS ============

// Add a task to a section
export async function addTemplateTask(sectionId: string, data: CreateTaskInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const task = await prisma.workflowTemplateTask.create({
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        taskType: data.taskType,
        isRequired: data.isRequired ?? true,
        daysOffset: data.daysOffset ?? 0,
        sectionId,
      },
      include: {
        section: { select: { templateId: true } },
      },
    });

    revalidatePath(`/workflows/${task.section.templateId}`);
    return { success: true, task };
  } catch (error: any) {
    console.error("Failed to add task:", error);
    return { success: false, error: error?.message || "Failed to add task" };
  }
}

// Update a task
export async function updateTemplateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    order?: number;
    taskType?: "TEAM_TASK" | "CLIENT_REQUEST";
    isRequired?: boolean;
    daysOffset?: number;
    allowClientUpload?: boolean;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const task = await prisma.workflowTemplateTask.update({
      where: { id: taskId },
      data,
      include: {
        section: { select: { templateId: true } },
      },
    });

    revalidatePath(`/workflows/${task.section.templateId}`);
    return { success: true, task };
  } catch (error: any) {
    console.error("Failed to update task:", error);
    return { success: false, error: error?.message || "Failed to update task" };
  }
}

// Delete a task
export async function deleteTemplateTask(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const task = await prisma.workflowTemplateTask.delete({
      where: { id: taskId },
      include: {
        section: { select: { templateId: true } },
      },
    });

    revalidatePath(`/workflows/${task.section.templateId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete task:", error);
    return { success: false, error: error?.message || "Failed to delete task" };
  }
}

// ============ SUBTASK OPERATIONS ============

// Add a subtask to a task
export async function addTemplateSubtask(taskId: string, data: CreateSubtaskInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const subtask = await prisma.workflowTemplateSubtask.create({
      data: {
        title: data.title,
        order: data.order,
        isRequired: data.isRequired ?? false,
        taskId,
      },
      include: {
        task: {
          select: {
            section: { select: { templateId: true } },
          },
        },
      },
    });

    revalidatePath(`/workflows/${subtask.task.section.templateId}`);
    return { success: true, subtask };
  } catch (error: any) {
    console.error("Failed to add subtask:", error);
    return { success: false, error: error?.message || "Failed to add subtask" };
  }
}

// Update a subtask
export async function updateTemplateSubtask(
  subtaskId: string,
  data: { title?: string; order?: number; isRequired?: boolean }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const subtask = await prisma.workflowTemplateSubtask.update({
      where: { id: subtaskId },
      data,
      include: {
        task: {
          select: {
            section: { select: { templateId: true } },
          },
        },
      },
    });

    revalidatePath(`/workflows/${subtask.task.section.templateId}`);
    return { success: true, subtask };
  } catch (error: any) {
    console.error("Failed to update subtask:", error);
    return { success: false, error: error?.message || "Failed to update subtask" };
  }
}

// Delete a subtask
export async function deleteTemplateSubtask(subtaskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const subtask = await prisma.workflowTemplateSubtask.delete({
      where: { id: subtaskId },
      include: {
        task: {
          select: {
            section: { select: { templateId: true } },
          },
        },
      },
    });

    revalidatePath(`/workflows/${subtask.task.section.templateId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete subtask:", error);
    return { success: false, error: error?.message || "Failed to delete subtask" };
  }
}

// ============ AUTOMATION OPERATIONS ============

// Add an automation to a task
export async function addTemplateAutomation(taskId: string, data: CreateAutomationInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const automation = await prisma.workflowTemplateAutomation.create({
      data: {
        trigger: data.trigger,
        action: data.action,
        actionData: data.actionData,
        taskId,
      },
      include: {
        task: {
          select: {
            section: { select: { templateId: true } },
          },
        },
      },
    });

    revalidatePath(`/workflows/${automation.task.section.templateId}`);
    return { success: true, automation };
  } catch (error: any) {
    console.error("Failed to add automation:", error);
    return { success: false, error: error?.message || "Failed to add automation" };
  }
}

// Delete an automation
export async function deleteTemplateAutomation(automationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const automation = await prisma.workflowTemplateAutomation.delete({
      where: { id: automationId },
      include: {
        task: {
          select: {
            section: { select: { templateId: true } },
          },
        },
      },
    });

    revalidatePath(`/workflows/${automation.task.section.templateId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete automation:", error);
    return { success: false, error: error?.message || "Failed to delete automation" };
  }
}

// ============ ATTACHMENT OPERATIONS ============

// Add an attachment to a task
export async function addTemplateAttachment(
  taskId: string,
  data: { name: string; fileUrl: string; fileSize?: number; mimeType?: string }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const attachment = await prisma.workflowTemplateAttachment.create({
      data: {
        name: data.name,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        taskId,
      },
      include: {
        task: {
          select: {
            section: { select: { templateId: true } },
          },
        },
      },
    });

    revalidatePath(`/workflows/${attachment.task.section.templateId}`);
    return { success: true, attachment };
  } catch (error: any) {
    console.error("Failed to add attachment:", error);
    return { success: false, error: error?.message || "Failed to add attachment" };
  }
}

// Delete an attachment
export async function deleteTemplateAttachment(attachmentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can modify templates" };
    }

    const attachment = await prisma.workflowTemplateAttachment.delete({
      where: { id: attachmentId },
      include: {
        task: {
          select: {
            section: { select: { templateId: true } },
          },
        },
      },
    });

    revalidatePath(`/workflows/${attachment.task.section.templateId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete attachment:", error);
    return { success: false, error: error?.message || "Failed to delete attachment" };
  }
}
