"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createWorkflowTemplate } from "@/app/actions/templates";
import { getClients } from "@/app/actions/clients";
import { GitBranch, X } from "lucide-react";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
}: CreateTemplateDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Client selection state
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Load clients when dialog opens
  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    setIsLoadingClients(true);
    try {
      const clientsData = await getClients();
      setClients(clientsData.map(c => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const removeClient = (clientId: string) => {
    setSelectedClientIds((prev) => prev.filter((id) => id !== clientId));
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await createWorkflowTemplate({
        name: title.trim(),
        description: description.trim() || undefined,
        clientIds: selectedClientIds,
      });

      if (result.success && result.template) {
        setTitle("");
        setDescription("");
        setSelectedClientIds([]);
        setClientSearch("");
        onOpenChange(false);
        router.push(`/workflows/${result.template.id}`);
      } else {
        setError(result.error || "Failed to create template");
      }
    } catch (err) {
      setError("Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setSelectedClientIds([]);
    setClientSearch("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Create Project Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title<span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="E.g, Monthly Payroll"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Clients (Optional)
            </Label>
            <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[42px]">
              {selectedClientIds.map((clientId) => {
                const client = clients.find((c) => c.id === clientId);
                if (!client) return null;
                return (
                  <Badge
                    key={clientId}
                    variant="secondary"
                    className="flex items-center gap-1 bg-purple-100 text-purple-800"
                  >
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeClient(clientId)}
                    />
                    {client.name}
                  </Badge>
                );
              })}
              <input
                type="text"
                placeholder="search clients"
                className="flex-1 min-w-[100px] outline-none text-sm"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                disabled={isSubmitting || isLoadingClients}
              />
            </div>
            {clientSearch && (
              <div className="border rounded-md max-h-[150px] overflow-y-auto">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      toggleClient(client.id);
                      setClientSearch("");
                    }}
                  >
                    <span>{client.name}</span>
                    {selectedClientIds.includes(client.id) && (
                      <span className="text-blue-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">Optionally select clients to create projects immediately.</p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
