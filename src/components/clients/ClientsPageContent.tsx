"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Search, Filter, MoreHorizontal, Users, Eye, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateClientDialog, ClientFormData } from "./CreateClientDialog";
import { createClient, deleteClient, approveClient, rejectClient } from "@/app/actions/clients";
import { getTeamMembers } from "@/app/actions/team";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  approvalStatus?: string;
  activeProjects: number;
  totalProjects: number;
}

interface ClientsPageContentProps {
  initialClients: Client[];
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    PROSPECT: "bg-blue-100 text-blue-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function getApprovalStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: "bg-orange-100 text-orange-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export function ClientsPageContent({ initialClients }: ClientsPageContentProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isPartner = userRole === "PARTNER";
  const canCreateClient = userRole === "PARTNER" || userRole === "MANAGER";
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      const members = await getTeamMembers();
      setTeamMembers(members);
    };
    fetchTeamMembers();
  }, []);

  const handleCreateClient = async (data: ClientFormData) => {
    const result = await createClient(data);
    if (result.success) {
      // Show appropriate message based on whether approval is needed
      if (result.needsApproval) {
        alert("Client submitted for Partner approval. You will be notified once approved.");
      } else {
        alert("Client created successfully! Portal access link sent to client.");
        // Refresh the page to show the new client
        window.location.reload();
      }
    } else {
      throw new Error(result.error || "Failed to create client");
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(clientId);
    try {
      const result = await deleteClient(clientId);
      if (result.success) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
      } else {
        alert(result.error || "Failed to delete client");
      }
    } catch (error) {
      alert("Failed to delete client");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleApproveClient = async (clientId: string) => {
    try {
      const result = await approveClient(clientId);
      if (result.success) {
        setClients((prev) => 
          prev.map((c) => c.id === clientId ? { ...c, approvalStatus: "APPROVED" } : c)
        );
        alert("Client approved successfully");
      } else {
        alert(result.error || "Failed to approve client");
      }
    } catch (error) {
      alert("Failed to approve client");
    }
  };

  const handleRejectClient = async (clientId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;
    
    try {
      const result = await rejectClient(clientId, reason);
      if (result.success) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        alert("Client rejected");
      } else {
        alert(result.error || "Failed to reject client");
      }
    } catch (error) {
      alert("Failed to reject client");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500">Manage your client relationships</p>
        </div>
        {canCreateClient && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Client List */}
      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No clients yet</h3>
              <p className="text-gray-500 text-center mb-4">
                {canCreateClient ? "Get started by adding your first client" : "No clients assigned to you yet"}
              </p>
              {canCreateClient && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Projects
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.company}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{client.email}</p>
                      <p className="text-sm text-gray-500">{client.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      {client.approvalStatus === "PENDING" ? (
                        <Badge className={getApprovalStatusColor("PENDING")}>
                          Pending Verification
                        </Badge>
                      ) : (
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{client.activeProjects} active</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isDeleting === client.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {isPartner && (
                            <>
                              {client.approvalStatus === "PENDING" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                    onClick={() => handleApproveClient(client.id)}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve Client
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={() => handleRejectClient(client.id)}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject Client
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/clients/${client.id}/edit`} className="flex items-center">
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create Client Dialog */}
      <CreateClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateClient}
        teamMembers={teamMembers}
        allClients={clients}
      />
    </div>
  );
}
