import { Suspense } from "react";
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
  MoreHorizontal,
  Send,
  Eye,
  Download,
  Trash2,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInvoices, getBillingStats, getTimeEntries } from "@/app/actions/billing";

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SENT: "bg-blue-100 text-blue-800",
    VIEWED: "bg-purple-100 text-purple-800",
    PAID: "bg-green-100 text-green-800",
    PARTIAL: "bg-yellow-100 text-yellow-800",
    OVERDUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

async function BillingStatsCards() {
  const stats = await getBillingStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue Invoices</p>
              <p className="text-2xl font-bold">{stats.overdueInvoices}</p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">This Year</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.yearlyRevenue)}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function InvoicesTab() {
  const invoices = await getInvoices();

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No invoices yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Create your first invoice to start tracking payments.
        </p>
        <Button className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice: any) => (
        <Card key={invoice.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                  <span>{invoice.client.preferredName || invoice.client.legalName}</span>
                  {invoice.project && (
                    <>
                      <span>•</span>
                      <span>{invoice.project.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(invoice.total)}</p>
                  {invoice.paidAmount > 0 && invoice.paidAmount < invoice.total && (
                    <p className="text-sm text-gray-500">
                      Paid: {formatCurrency(invoice.paidAmount)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Due</p>
                  <p className="font-medium">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Send className="mr-2 h-4 w-4" />
                      Send to Client
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Record Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function TimeTrackingTab() {
  const timeEntries = await getTimeEntries();

  if (timeEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No time entries</h3>
        <p className="mt-2 text-sm text-gray-500">
          Start tracking time to bill clients accurately.
        </p>
        <Button className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Start Timer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timeEntries.map((entry: any) => (
        <Card key={entry.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">
                    {entry.description || "No description"}
                  </h3>
                  {entry.billable && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Billable
                    </Badge>
                  )}
                  {entry.billed && (
                    <Badge className="bg-green-100 text-green-800">Billed</Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                  <span>{entry.user.name || entry.user.email}</span>
                  {entry.client && (
                    <>
                      <span>•</span>
                      <span>{entry.client.preferredName || entry.client.legalName}</span>
                    </>
                  )}
                  {entry.project && (
                    <>
                      <span>•</span>
                      <span>{entry.project.name}</span>
                    </>
                  )}
                  {entry.task && (
                    <>
                      <span>•</span>
                      <span>{entry.task.title}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {entry.duration ? formatDuration(entry.duration) : "Running..."}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.startTime).toLocaleDateString()}
                  </p>
                </div>
                {entry.rate && (
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency((entry.duration || 0) / 60 * entry.rate)}
                    </p>
                    <p className="text-sm text-gray-500">
                      @ {formatCurrency(entry.rate)}/hr
                    </p>
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-500">Manage invoices, payments, and time tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Start Timer
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4"><div className="h-24 bg-gray-100 rounded animate-pulse" /><div className="h-24 bg-gray-100 rounded animate-pulse" /><div className="h-24 bg-gray-100 rounded animate-pulse" /><div className="h-24 bg-gray-100 rounded animate-pulse" /></div>}>
        <BillingStatsCards />
      </Suspense>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">
            <FileText className="mr-2 h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="time">
            <Clock className="mr-2 h-4 w-4" />
            Time Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Suspense fallback={<div className="text-center py-8">Loading invoices...</div>}>
            <InvoicesTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="time">
          <Suspense fallback={<div className="text-center py-8">Loading time entries...</div>}>
            <TimeTrackingTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
