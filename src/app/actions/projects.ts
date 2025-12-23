"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendTaskNotificationToClient } from "@/app/actions/send-task-notification";

export async function getProjects() {
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
      // Partner sees all projects
      whereClause = {};
    } else if (userRole === "MANAGER") {
      // Manager sees projects they or their subordinates are assigned to
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      const teamIds = [userId, ...subordinates.map((s) => s.id)];

      whereClause = {
        assignments: {
          some: {
            userId: { in: teamIds },
          },
        },
      };
    } else if (userRole === "ASSOCIATE") {
      // Associate sees only projects they are assigned to
      whereClause = {
        assignments: {
          some: {
            userId: userId,
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            legalName: true,
            preferredName: true,
          },
        },
        tag: true,
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            taskType: true,
            status: true,
          },
        },
      },
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      dueDate: project.dueDate,
      completedAt: project.completedAt,
      client: {
        id: project.client.id,
        name: project.client.preferredName || project.client.legalName,
      },
      tag: project.tag ? {
        id: project.tag.id,
        name: project.tag.name,
        color: project.tag.color,
      } : null,
      assignees: project.assignments.map((a) => ({
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        avatar: a.user.avatar,
        role: a.role,
      })),
      clientTaskCount: project.tasks.filter((t: any) => t.taskType === "CLIENT_REQUEST").length,
      completedClientTaskCount: project.tasks.filter((t: any) => t.taskType === "CLIENT_REQUEST" && t.status === "COMPLETED").length,
    }));
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

export async function getProjectById(projectId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        tag: true,
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        tasks: {
          orderBy: { dueDate: "asc" },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Check access for non-partners
    if (userRole !== "PARTNER") {
      const hasAccess = project.assignments.some((a) => {
        if (a.user.id === userId) return true;
        // Managers can access if their subordinate is assigned
        if (userRole === "MANAGER") {
          // Check if any assignee reports to this manager
          return false; // Will need additional check
        }
        return false;
      });

      if (!hasAccess && userRole === "MANAGER") {
        // Check if any subordinate is assigned
        const subordinates = await prisma.user.findMany({
          where: { managerId: userId },
          select: { id: true },
        });
        const subordinateIds = subordinates.map((s) => s.id);
        const hasSubordinateAccess = project.assignments.some((a) =>
          subordinateIds.includes(a.user.id)
        );
        if (!hasSubordinateAccess) {
          return { success: false, error: "Access denied" };
        }
      } else if (!hasAccess) {
        return { success: false, error: "Access denied" };
      }
    }

    return { success: true, project, userRole };
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return { success: false, error: "Failed to fetch project" };
  }
}

interface CreateProjectInput {
  name: string;
  description?: string;
  type: string;
  priority?: string;
  clientId: string;
  startDate?: string;
  dueDate?: string;
  assigneeIds?: string[];
  templateId?: string;
}

export async function createProject(data: CreateProjectInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;

    // Only Partners and Managers can create projects
    if (userRole === "ASSOCIATE") {
      return { success: false, error: "Associates cannot create projects" };
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type as any,
        priority: (data.priority as any) || "MEDIUM",
        clientId: data.clientId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: "NOT_STARTED",
        templateId: data.templateId,
        assignments: data.assigneeIds
          ? {
              create: data.assigneeIds.map((userId) => ({
                userId,
                role: "PREPARER" as const,
              })),
            }
          : undefined,
      },
    });

    // If a template is provided, copy tasks from the template
    if (data.templateId) {
      const template = await prisma.workflowTemplate.findUnique({
        where: { id: data.templateId },
        include: {
          sections: {
            include: {
              tasks: {
                include: {
                  subtasks: true,
                },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      });

      if (template) {
        // Create tasks from template sections
        for (const section of template.sections) {
          for (const templateTask of section.tasks) {
            // Create the main task
            const newTask = await prisma.task.create({
              data: {
                title: templateTask.title,
                description: templateTask.description,
                projectId: project.id,
                createdById: user.id,
                order: templateTask.order,
                status: "TODO",
                taskType: templateTask.taskType as any || "TEAM_TASK",
              },
            });

            // Automatically send notification if it's a CLIENT_REQUEST task
            if (templateTask.taskType === "CLIENT_REQUEST") {
              await sendTaskNotificationToClient(newTask.id);
            }

            // Create subtasks
            for (const subtask of templateTask.subtasks) {
              await prisma.task.create({
                data: {
                  title: subtask.title,
                  projectId: project.id,
                  createdById: user.id,
                  parentId: newTask.id,
                  order: subtask.order,
                  status: "TODO",
                  taskType: templateTask.taskType as any || "TEAM_TASK",
                },
              });
            }
          }
        }
      }
    }

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true, project };
  } catch (error: any) {
    console.error("Failed to create project:", error);
    return { success: false, error: error?.message || "Failed to create project" };
  }
}

export async function updateProject(
  projectId: string,
  data: Partial<CreateProjectInput> & { status?: string }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;

    // Only Partners and Managers can update projects
    if (userRole === "ASSOCIATE") {
      return { success: false, error: "Associates cannot update projects" };
    }

    // Set completedAt when status changes to COMPLETED
    const completedAt = data.status === "COMPLETED" ? new Date() : undefined;
    
    // If status is changing away from COMPLETED, clear completedAt
    const clearCompletedAt = data.status && data.status !== "COMPLETED" ? null : undefined;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        type: data.type as any,
        priority: data.priority as any,
        status: data.status as any,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt: completedAt || clearCompletedAt,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, project };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;

    // Only Partners can delete projects
    if (userRole !== "PARTNER") {
      return { success: false, error: "Only Partners can delete projects" };
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

export async function assignUserToProject(projectId: string, userId: string, role: string = "MEMBER") {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;

    // Only Partners and Managers can assign users
    if (userRole === "ASSOCIATE") {
      return { success: false, error: "Associates cannot assign users to projects" };
    }

    await prisma.projectAssignment.create({
      data: {
        projectId,
        userId,
        role: role as any,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to assign user to project:", error);
    return { success: false, error: "Failed to assign user" };
  }
}

export async function removeUserFromProject(projectId: string, userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;

    // Only Partners and Managers can remove users
    if (userRole === "ASSOCIATE") {
      return { success: false, error: "Associates cannot remove users from projects" };
    }

    await prisma.projectAssignment.deleteMany({
      where: {
        projectId,
        userId,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove user from project:", error);
    return { success: false, error: "Failed to remove user" };
  }
}

// Add task to project
export async function addProjectTask(
  projectId: string,
  data: {
    title: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    parentId?: string;
    order?: number;
    taskType?: "TEAM_TASK" | "CLIENT_REQUEST";
    attachments?: Array<{
      name: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
    }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    // Look up user by email to get the correct database ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const newTask = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId,
        assigneeId: data.assigneeId,
        createdById: user.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        parentId: data.parentId,
        order: data.order || 0,
        status: "TODO",
        taskType: data.taskType || "TEAM_TASK",
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        subtasks: true,
      },
    });

    // Add attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      await Promise.all(
        data.attachments.map((attachment) =>
          prisma.taskAttachment.create({
            data: {
              name: attachment.name,
              fileUrl: attachment.fileUrl,
              fileSize: attachment.fileSize,
              mimeType: attachment.mimeType,
              taskId: newTask.id,
              uploadedById: user.id,
            },
          })
        )
      );
    }

    // Automatically send notification if it's a CLIENT_REQUEST task
    if (data.taskType === "CLIENT_REQUEST") {
      await sendTaskNotificationToClient(newTask.id);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, task: newTask };
  } catch (error: any) {
    console.error("Failed to add task:", error);
    return { success: false, error: error?.message || "Failed to add task" };
  }
}

// Update project task
export async function updateProjectTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    assigneeId?: string;
    status?: string;
    dueDate?: string;
    order?: number;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        status: data.status as any,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        order: data.order,
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        subtasks: true,
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true, task };
  } catch (error: any) {
    console.error("Failed to update task:", error);
    return { success: false, error: error?.message || "Failed to update task" };
  }
}

// Delete project task
export async function deleteProjectTask(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get task details before deletion
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, taskType: true },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // If it's a CLIENT_REQUEST task, delete associated documents
    if (task.taskType === "CLIENT_REQUEST") {
      await prisma.document.deleteMany({
        where: {
          taskId: taskId,
        },
      });
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Failed to delete task" };
  }
}

// Get project tasks with subtasks
export async function getProjectTasks(projectId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized", tasks: [] };
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        parentId: null, // Only get top-level tasks
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        subtasks: {
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true, email: true },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return { success: true, tasks };
  } catch (error) {
    console.error("Failed to get project tasks:", error);
    return { success: false, error: "Failed to get tasks", tasks: [] };
  }
}

// Send notification to client for a task
export async function sendClientTaskNotification(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the task with project and client info
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            client: {
              include: {
                portalAccess: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.taskType !== "CLIENT_REQUEST") {
      return { success: false, error: "Only client request tasks can be sent to clients" };
    }

    if (!task.project.client) {
      return { success: false, error: "No client associated with this project" };
    }

    // Update the task with notification sent timestamp
    await prisma.task.update({
      where: { id: taskId },
      data: {
        clientNotificationSentAt: new Date(),
      },
    });

    // TODO: Send actual email notification to client
    // For now, just mark the task as notified

    revalidatePath(`/projects/${task.projectId}`);
    return { 
      success: true, 
      message: `Notification sent to ${task.project.client.preferredName || task.project.client.legalName}` 
    };
  } catch (error: any) {
    console.error("Failed to send client notification:", error);
    return { success: false, error: error?.message || "Failed to send notification" };
  }
}
