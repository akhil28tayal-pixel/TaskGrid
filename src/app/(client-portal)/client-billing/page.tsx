"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Download,
  Calendar,
  Loader2,
  DollarSign,
  FileText,
  CheckCircle2
} from "lucide-react";
import { getClientBilling } from "@/app/actions/client-portal";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
  issuedDate: string;
  projectName: string | null;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PAID":
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    case "PENDING":
      return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
    case "OVERDUE":
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
}

export default function ClientBillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDue: 0,
    totalPaid: 0,
    pendingInvoices: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/client-login");
      return;
    }

    if (status === "authenticated" && (session?.user as any)?.clientId) {
      fetchBilling();
    }
  }, [status, session, router]);

  const fetchBilling = async () => {
    const clientId = (session?.user as any)?.clientId;
    if (!clientId) return;

    const result = await getClientBilling(clientId);
    if (result.success) {
      setInvoices(result.invoices || []);
      setStats(result.stats || { totalDue: 0, totalPaid: 0, pendingInvoices: 0 });
    }
    setIsLoading(false);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">View your invoices and payment history</p>
      </div>

      {/* Billing Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Amount Due</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${stats.totalDue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ${stats.totalPaid.toLocaleString()}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Invoices</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendingInvoices}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Invoice #{invoice.invoiceNumber}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        {invoice.projectName && (
                          <span className="text-xs text-gray-400">
                            {invoice.projectName}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">
                      ${invoice.amount.toLocaleString()}
                    </span>
                    {getStatusBadge(invoice.status)}
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
