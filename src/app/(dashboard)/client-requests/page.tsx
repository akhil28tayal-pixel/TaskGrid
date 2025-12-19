import { Suspense } from "react";
import {
  Plus,
  Search,
  Filter,
  FileUp,
  MessageSquare,
  PenLine,
  CreditCard,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Send,
  Trash2,
  Eye,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getClientRequests } from "@/app/actions/client-portal";

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    OVERDUE: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function getTypeIcon(type: string) {
  const icons: Record<string, any> = {
    DOCUMENT_UPLOAD: FileUp,
    INFORMATION: MessageSquare,
    SIGNATURE: PenLine,
    PAYMENT: CreditCard,
    REVIEW: Eye,
    APPROVAL: CheckCircle,
  };
  return icons[type] || MessageSquare;
}

function formatType(type: string) {
  const map: Record<string, string> = {
    DOCUMENT_UPLOAD: "Document Upload",
    INFORMATION: "Information Request",
    SIGNATURE: "Signature Required",
    PAYMENT: "Payment",
    REVIEW: "Review",
    APPROVAL: "Approval",
  };
  return map[type] || type;
}

async function ClientRequestsList() {
  const requests = await getClientRequests();

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No client requests</h3>
        <p className="mt-2 text-sm text-gray-500">
          Create requests to collect documents and information from clients.
        </p>
        <Button className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Create Request
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request: any) => {
        const TypeIcon = getTypeIcon(request.type);
        const isOverdue = request.dueDate && new Date(request.dueDate) < new Date() && request.status !== "COMPLETED";
        
        return (
          <Card key={request.id} className={isOverdue ? "border-red-200" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-2 ${isOverdue ? "bg-red-100" : "bg-gray-100"}`}>
                    <TypeIcon className={`h-5 w-5 ${isOverdue ? "text-red-600" : "text-gray-600"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{request.title}</h3>
                      <Badge className={getStatusColor(isOverdue ? "OVERDUE" : request.status)}>
                        {isOverdue ? "Overdue" : request.status}
                      </Badge>
                      <Badge variant="outline">{formatType(request.type)}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span>{request.client.preferredName || request.client.legalName}</span>
                      {request.project && (
                        <>
                          <span>•</span>
                          <span>{request.project.name}</span>
                        </>
                      )}
                      {request.reminderCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            {request.reminderCount} reminder{request.reminderCount > 1 ? "s" : ""} sent
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {request.dueDate && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Due</p>
                      <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                        {new Date(request.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {request.status === "PENDING" && (
                      <Button variant="outline" size="sm">
                        <Send className="mr-2 h-4 w-4" />
                        Send Reminder
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          Send Reminder
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              {request.description && (
                <p className="mt-3 text-sm text-gray-600 pl-14">{request.description}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function ClientRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Requests</h1>
          <p className="text-gray-500">Manage document requests and information collection</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline">
          <Clock className="mr-2 h-4 w-4" />
          Pending Only
        </Button>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading requests...</div>}>
        <ClientRequestsList />
      </Suspense>
    </div>
  );
}
