"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ============================================
// WORKFLOW TEMPLATES
// ============================================

export async function getWorkflowTemplates() {
  try {
    const templates = await (prisma as any).workflowTemplate.findMany({
      where: { isActive: true },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
            },
          },
        },
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return templates;
  } catch (error) {
    console.error("Failed to fetch workflow templates:", error);
    return [];
  }
}

// Note: Template CRUD operations have been moved to templates.ts
// This file now only contains recurring work operations

// ============================================
// RECURRING WORK
// ============================================

export async function getRecurringWork() {
  try {
    const recurringWork = await prisma.recurringWork.findMany({
      include: {
        client: {
          select: { id: true, legalName: true, preferredName: true },
        },
        template: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { generatedProjects: true },
        },
      },
      orderBy: { nextRunDate: "asc" },
    });

    return recurringWork;
  } catch (error) {
    console.error("Failed to fetch recurring work:", error);
    return [];
  }
}

interface CreateRecurringWorkInput {
  name: string;
  description?: string;
  projectType: string;
  frequency: string;
  interval: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  monthOfYear?: number;
  startDate: string;
  endDate?: string;
  clientId: string;
  templateId?: string;
  assigneeId?: string;
  autoAssign: boolean;
}

export async function createRecurringWork(data: CreateRecurringWorkInput) {
  try {
    const startDate = new Date(data.startDate);
    
    const recurringWork = await prisma.recurringWork.create({
      data: {
        name: data.name,
        description: data.description,
        projectType: data.projectType as any,
        frequency: data.frequency as any,
        interval: data.interval,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        monthOfYear: data.monthOfYear,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        nextRunDate: startDate,
        clientId: data.clientId,
        templateId: data.templateId || null,
        assigneeId: data.assigneeId || null,
        autoAssign: data.autoAssign,
      },
    });

    revalidatePath("/workflows");
    return { success: true, recurringWork };
  } catch (error) {
    console.error("Failed to create recurring work:", error);
    return { success: false, error: "Failed to create recurring work" };
  }
}

export async function toggleRecurringWork(id: string, isActive: boolean) {
  try {
    await prisma.recurringWork.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/workflows");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle recurring work:", error);
    return { success: false, error: "Failed to toggle recurring work" };
  }
}

export async function deleteRecurringWork(id: string) {
  try {
    await prisma.recurringWork.delete({
      where: { id },
    });

    revalidatePath("/workflows");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete recurring work:", error);
    return { success: false, error: "Failed to delete recurring work" };
  }
}

// Generate project from recurring work
export async function generateProjectFromRecurring(recurringWorkId: string) {
  try {
    const recurringWork = await (prisma as any).recurringWork.findUnique({
      where: { id: recurringWorkId },
      include: {
        template: {
          include: {
            sections: {
              orderBy: { order: "asc" },
              include: {
                tasks: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
        client: true,
      },
    });

    if (!recurringWork) {
      return { success: false, error: "Recurring work not found" };
    }

    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Default 30 days

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: `${recurringWork.name} - ${startDate.toLocaleDateString()}`,
        description: recurringWork.description,
        type: recurringWork.projectType,
        status: "NOT_STARTED",
        startDate,
        dueDate,
        clientId: recurringWork.clientId,
        templateId: recurringWork.templateId,
        recurringWorkId: recurringWork.id,
      },
    });

    // Create tasks from template sections
    if (recurringWork.template?.sections) {
      const createdById = recurringWork.assigneeId || "system";
      let taskOrder = 0;
      
      for (const section of recurringWork.template.sections as any[]) {
        for (const task of section.tasks || []) {
          const taskDueDate = new Date(startDate);
          taskDueDate.setDate(taskDueDate.getDate() + (task.daysOffset || 0));

          await prisma.task.create({
            data: {
              title: task.title,
              description: task.description,
              status: "TODO",
              dueDate: taskDueDate,
              projectId: project.id,
              assigneeId: recurringWork.autoAssign ? recurringWork.assigneeId : null,
              createdById,
              order: taskOrder++,
            },
          });
        }
      }
    }

    // Update next run date
    const nextRunDate = calculateNextRunDate(recurringWork);
    await prisma.recurringWork.update({
      where: { id: recurringWorkId },
      data: {
        lastRunDate: new Date(),
        nextRunDate,
      },
    });

    revalidatePath("/workflows");
    revalidatePath("/projects");
    return { success: true, project };
  } catch (error) {
    console.error("Failed to generate project from recurring work:", error);
    return { success: false, error: "Failed to generate project" };
  }
}

function calculateNextRunDate(recurringWork: any): Date {
  const current = new Date(recurringWork.nextRunDate);
  const next = new Date(current);

  switch (recurringWork.frequency) {
    case "DAILY":
      next.setDate(next.getDate() + recurringWork.interval);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7 * recurringWork.interval);
      break;
    case "BIWEEKLY":
      next.setDate(next.getDate() + 14 * recurringWork.interval);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + recurringWork.interval);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3 * recurringWork.interval);
      break;
    case "ANNUALLY":
      next.setFullYear(next.getFullYear() + recurringWork.interval);
      break;
  }

  return next;
}

// ============================================
// APPLY TEMPLATE TO PROJECT
// ============================================

export async function applyTemplateToProject(projectId: string, templateId: string) {
  try {
    const template = await (prisma as any).workflowTemplate.findUnique({
      where: { id: templateId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const startDate = project.startDate || new Date();

    // Create tasks from template sections
    let taskOrder = 0;
    for (const section of template.sections || []) {
      for (const task of section.tasks || []) {
        const taskDueDate = new Date(startDate);
        taskDueDate.setDate(taskDueDate.getDate() + (task.daysOffset || 0));

        await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            status: "TODO",
            dueDate: taskDueDate,
            projectId: project.id,
            createdById: "system",
            order: taskOrder++,
          },
        });
      }
    }

    // Link template to project
    await prisma.project.update({
      where: { id: projectId },
      data: { templateId },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to apply template to project:", error);
    return { success: false, error: "Failed to apply template" };
  }
}
