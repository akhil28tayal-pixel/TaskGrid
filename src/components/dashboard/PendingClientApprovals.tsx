"use client";

import { useState } from "react";
import { Check, X, User, Mail, Building, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approveClient, rejectClient } from "@/app/actions/clients";

interface PendingClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: Date;
  createdById: string | null;
}

interface PendingClientApprovalsProps {
  pendingClients: PendingClient[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PendingClientApprovals({ pendingClients: initialClients }: PendingClientApprovalsProps) {
  const [clients, setClients] = useState(initialClients);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [clientToReject, setClientToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async (clientId: string) => {
    setIsApproving(clientId);
    try {
      const result = await approveClient(clientId);
      if (result.success) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
      } else {
        alert(result.error || "Failed to approve client");
      }
    } catch (error) {
      alert("Failed to approve client");
    } finally {
      setIsApproving(null);
    }
  };

  const openRejectDialog = (clientId: string) => {
    setClientToReject(clientId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!clientToReject) return;
    
    setIsRejecting(true);
    try {
      const result = await rejectClient(clientToReject, rejectionReason);
      if (result.success) {
        setClients((prev) => prev.filter((c) => c.id !== clientToReject));
        setRejectDialogOpen(false);
      } else {
        alert(result.error || "Failed to reject client");
      }
    } catch (error) {
      alert("Failed to reject client");
    } finally {
      setIsRejecting(false);
    }
  };

  if (clients.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <User className="h-5 w-5" />
            Pending Client Approvals ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                      {client.company && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {client.company}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted {formatDate(client.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => openRejectDialog(client.id)}
                    disabled={isApproving === client.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(client.id)}
                    disabled={isApproving === client.id}
                  >
                    {isApproving === client.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Client</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this client. This will be visible to the manager who submitted the request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Client"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
