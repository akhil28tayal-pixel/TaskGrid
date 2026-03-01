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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRecurringWork } from "@/app/actions/workflows";
import { getClients } from "@/app/actions/clients";
import { getWorkflowTemplates } from "@/app/actions/templates";
import { RefreshCw } from "lucide-react";

interface CreateRecurringWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRecurringWorkDialog({
  open,
  onOpenChange,
}: CreateRecurringWorkDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<string>("MONTHLY");
  const [interval, setInterval] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsData, templatesData] = await Promise.all([
        getClients(),
        getWorkflowTemplates(),
      ]);
      setClients(clientsData.map(c => ({ id: c.id, name: c.name })));
      setTemplates(templatesData.map(t => ({ id: t.id, name: t.name })));
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!clientId) {
      setError("Please select a client");
      return;
    }

    if (!startDate) {
      setError("Start date is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await createRecurringWork({
        name: name.trim(),
        description: description.trim() || undefined,
        projectType: "OTHER",
        frequency,
        interval: parseInt(interval),
        startDate,
        endDate: endDate || undefined,
        clientId,
        templateId: templateId || undefined,
        assigneeId: undefined,
        autoAssign: false,
      });

      if (result.success) {
        handleClose();
        router.refresh();
      } else {
        setError(result.error || "Failed to create recurring work");
      }
    } catch (err) {
      setError("Failed to create recurring work");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setFrequency("MONTHLY");
    setInterval("1");
    setStartDate("");
    setEndDate("");
    setClientId(undefined);
    setTemplateId(undefined);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Create Recurring Work
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name<span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="E.g., Monthly Tax Filing"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">
                Client<span className="text-red-500">*</span>
              </Label>
              <Select value={clientId} onValueChange={setClientId} disabled={isSubmitting || isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template (Optional)</Label>
              <Select value={templateId} onValueChange={(value) => setTemplateId(value || undefined)} disabled={isSubmitting || isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">
                Frequency<span className="text-red-500">*</span>
              </Label>
              <Select value={frequency} onValueChange={setFrequency} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUALLY">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Interval</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                disabled={isSubmitting}
                placeholder="1"
              />
              <p className="text-xs text-gray-500">
                Every {interval} {frequency.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date<span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> Projects will be automatically created based on the frequency
              starting from the start date. For example, a monthly recurring work starting on Jan 1, 2026
              will create projects on Feb 1, Mar 1, and so on.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Creating..." : "Create Recurring Work"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
