import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to calculate next run date based on frequency
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

// Function to generate project from recurring work
async function generateProjectFromRecurringWork(recurringWork: any) {
  try {
    console.log(`[CRON] Generating project for recurring work: ${recurringWork.name}`);

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

    console.log(`[CRON] Project created: ${project.name} (ID: ${project.id})`);

    // Create tasks from template sections if template exists
    if (recurringWork.template?.sections) {
      const createdById = recurringWork.assigneeId || "system";
      let taskOrder = 0;
      
      for (const section of recurringWork.template.sections) {
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
      console.log(`[CRON] Created ${taskOrder} tasks for project ${project.id}`);
    }

    // Update next run date
    const nextRunDate = calculateNextRunDate(recurringWork);
    await prisma.recurringWork.update({
      where: { id: recurringWork.id },
      data: {
        lastRunDate: new Date(),
        nextRunDate,
      },
    });

    console.log(`[CRON] Next run date set to: ${nextRunDate.toISOString()}`);

    return { success: true, project };
  } catch (error) {
    console.error(`[CRON] Failed to generate project for recurring work ${recurringWork.id}:`, error);
    return { success: false, error };
  }
}

// Main cron job function to check and process recurring work
export async function processRecurringWork() {
  try {
    console.log('[CRON] Checking for recurring work to process...');
    
    const now = new Date();
    
    // Find all active recurring work where nextRunDate is due
    const dueRecurringWork = await prisma.recurringWork.findMany({
      where: {
        isActive: true,
        nextRunDate: {
          lte: now,
        },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      include: {
        client: {
          select: { id: true, legalName: true, preferredName: true },
        },
        template: {
          include: {
            sections: {
              orderBy: { order: 'asc' },
              include: {
                tasks: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (dueRecurringWork.length === 0) {
      console.log('[CRON] No recurring work due at this time');
      return { success: true, processed: 0 };
    }

    console.log(`[CRON] Found ${dueRecurringWork.length} recurring work item(s) to process`);

    let successCount = 0;
    let failureCount = 0;

    // Process each recurring work
    for (const work of dueRecurringWork) {
      const result = await generateProjectFromRecurringWork(work);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log(`[CRON] Processing complete: ${successCount} succeeded, ${failureCount} failed`);

    return {
      success: true,
      processed: dueRecurringWork.length,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error('[CRON] Error processing recurring work:', error);
    return { success: false, error };
  }
}

// Schedule the cron job to run every hour
let cronJob: any | null = null;

export function startRecurringWorkCron() {
  if (cronJob) {
    console.log('[CRON] Recurring work cron job is already running');
    return;
  }

  // Run every hour at minute 0
  // Cron format: minute hour day month dayOfWeek
  cronJob = cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running scheduled recurring work check...');
    await processRecurringWork();
  });

  console.log('[CRON] ✅ Recurring work cron job started (runs every hour)');
  
  // Run immediately on startup
  console.log('[CRON] Running initial check...');
  processRecurringWork();
}

export function stopRecurringWorkCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[CRON] Recurring work cron job stopped');
  }
}

// Export for manual testing
export { generateProjectFromRecurringWork };
