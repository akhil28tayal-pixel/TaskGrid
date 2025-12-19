import { Plus, Search, Filter, Upload, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const documents: Array<{
  id: string;
  name: string;
  type: string;
  category: string;
  status: string;
  client: string;
  project: string;
  dueDate: string | null;
}> = [];

const documentTabs = [
  { id: "all", name: "All Documents", count: 0 },
  { id: "needed", name: "Needed from Client", count: 0 },
  { id: "received", name: "Received", count: 0 },
  { id: "created", name: "Created for Client", count: 0 },
];

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    REQUESTED: "bg-blue-100 text-blue-800",
    RECEIVED: "bg-green-100 text-green-800",
    IN_REVIEW: "bg-purple-100 text-purple-800",
    APPROVED: "bg-green-100 text-green-800",
    DELIVERED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    NEEDED_FROM_CLIENT: "bg-orange-100 text-orange-800",
    RECEIVED_FROM_CLIENT: "bg-blue-100 text-blue-800",
    CREATED_FOR_CLIENT: "bg-green-100 text-green-800",
    INTERNAL: "bg-gray-100 text-gray-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
}

function formatType(type: string) {
  return type.replace(/_/g, " ");
}

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500">Manage client documents and deliverables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Request Document
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b">
        {documentTabs.map((tab) => (
          <button
            key={tab.id}
            className="flex items-center gap-2 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 data-[active=true]:border-primary data-[active=true]:text-primary"
            data-active={tab.id === "all"}
          >
            {tab.name}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Client / Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-gray-100 p-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.category.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getTypeColor(doc.type)}>{formatType(doc.type)}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{doc.client}</p>
                    <p className="text-xs text-gray-500">{doc.project}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{doc.dueDate || "-"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
