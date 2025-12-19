"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ============================================
// INVOICES
// ============================================

export async function getInvoices(filters?: {
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const where: any = {};

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
      where.issueDate = {};
      if (filters.startDate) {
        where.issueDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.issueDate.lte = new Date(filters.endDate);
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: { id: true, legalName: true, preferredName: true, primaryEmail: true },
        },
        project: {
          select: { id: true, name: true },
        },
        items: true,
        payments: true,
      },
      orderBy: { issueDate: "desc" },
    });

    return invoices;
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return [];
  }
}

export async function getInvoiceById(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        items: true,
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
    });

    return invoice;
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return null;
  }
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}`,
      },
    },
  });
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

interface CreateInvoiceInput {
  clientId: string;
  projectId?: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    rate: number;
  }[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export async function createInvoice(data: CreateInvoiceInput) {
  try {
    const invoiceNumber = await generateInvoiceNumber();
    
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const tax = data.tax || 0;
    const discount = data.discount || 0;
    const total = subtotal + (subtotal * tax / 100) - discount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        projectId: data.projectId || null,
        dueDate: new Date(data.dueDate),
        subtotal,
        tax,
        discount,
        total,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    revalidatePath("/billing");
    return { success: true, invoice };
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return { success: false, error: "Failed to create invoice" };
  }
}

export async function updateInvoiceStatus(id: string, status: string) {
  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: status as any },
    });

    revalidatePath("/billing");
    revalidatePath(`/billing/${id}`);
    return { success: true, invoice };
  } catch (error) {
    console.error("Failed to update invoice status:", error);
    return { success: false, error: "Failed to update invoice status" };
  }
}

export async function deleteInvoice(id: string) {
  try {
    await prisma.invoice.delete({
      where: { id },
    });

    revalidatePath("/billing");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return { success: false, error: "Failed to delete invoice" };
  }
}

// ============================================
// PAYMENTS
// ============================================

interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  paidAt?: string;
}

export async function recordPayment(data: RecordPaymentInput) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method as any,
        reference: data.reference,
        notes: data.notes,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      },
    });

    // Update invoice paid amount and status
    const newPaidAmount = invoice.paidAmount + data.amount;
    let newStatus = invoice.status;

    if (newPaidAmount >= invoice.total) {
      newStatus = "PAID";
    } else if (newPaidAmount > 0) {
      newStatus = "PARTIAL";
    }

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus as any,
        paidAt: newStatus === "PAID" ? new Date() : null,
      },
    });

    revalidatePath("/billing");
    revalidatePath(`/billing/${data.invoiceId}`);
    return { success: true, payment };
  } catch (error) {
    console.error("Failed to record payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

// ============================================
// TIME ENTRIES
// ============================================

export async function getTimeEntries(filters?: {
  userId?: string;
  clientId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  billable?: boolean;
  billed?: boolean;
}) {
  try {
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.billable !== undefined) where.billable = filters.billable;
    if (filters?.billed !== undefined) where.billed = filters.billed;

    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.startTime.lte = new Date(filters.endDate);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        client: {
          select: { id: true, legalName: true, preferredName: true },
        },
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return timeEntries;
  } catch (error) {
    console.error("Failed to fetch time entries:", error);
    return [];
  }
}

interface CreateTimeEntryInput {
  userId: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  billable?: boolean;
  rate?: number;
  projectId?: string;
  taskId?: string;
  clientId?: string;
}

export async function createTimeEntry(data: CreateTimeEntryInput) {
  try {
    const startTime = new Date(data.startTime);
    const endTime = data.endTime ? new Date(data.endTime) : null;
    
    let duration = data.duration;
    if (!duration && endTime) {
      duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: data.userId,
        description: data.description,
        startTime,
        endTime,
        duration,
        billable: data.billable ?? true,
        rate: data.rate,
        projectId: data.projectId || null,
        taskId: data.taskId || null,
        clientId: data.clientId || null,
      },
    });

    revalidatePath("/time-tracking");
    return { success: true, timeEntry };
  } catch (error) {
    console.error("Failed to create time entry:", error);
    return { success: false, error: "Failed to create time entry" };
  }
}

export async function stopTimeEntry(id: string) {
  try {
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!timeEntry) {
      return { success: false, error: "Time entry not found" };
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - timeEntry.startTime.getTime()) / 60000);

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: {
        endTime,
        duration,
      },
    });

    revalidatePath("/time-tracking");
    return { success: true, timeEntry: updated };
  } catch (error) {
    console.error("Failed to stop time entry:", error);
    return { success: false, error: "Failed to stop time entry" };
  }
}

export async function deleteTimeEntry(id: string) {
  try {
    await prisma.timeEntry.delete({
      where: { id },
    });

    revalidatePath("/time-tracking");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete time entry:", error);
    return { success: false, error: "Failed to delete time entry" };
  }
}

// ============================================
// BILLING STATS
// ============================================

export async function getBillingStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalOutstanding,
      overdueInvoices,
      monthlyRevenue,
      yearlyRevenue,
      recentPayments,
    ] = await Promise.all([
      // Total outstanding
      prisma.invoice.aggregate({
        where: {
          status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] },
        },
        _sum: { total: true },
      }),
      // Overdue invoices count
      prisma.invoice.count({
        where: {
          status: "OVERDUE",
        },
      }),
      // Monthly revenue
      prisma.payment.aggregate({
        where: {
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      // Yearly revenue
      prisma.payment.aggregate({
        where: {
          paidAt: { gte: startOfYear },
        },
        _sum: { amount: true },
      }),
      // Recent payments
      prisma.payment.findMany({
        take: 5,
        orderBy: { paidAt: "desc" },
        include: {
          invoice: {
            include: {
              client: {
                select: { legalName: true, preferredName: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      totalOutstanding: totalOutstanding._sum.total || 0,
      overdueInvoices,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      yearlyRevenue: yearlyRevenue._sum.amount || 0,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        paidAt: p.paidAt,
        client: p.invoice.client.preferredName || p.invoice.client.legalName,
        invoiceNumber: p.invoice.invoiceNumber,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch billing stats:", error);
    return {
      totalOutstanding: 0,
      overdueInvoices: 0,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      recentPayments: [],
    };
  }
}
