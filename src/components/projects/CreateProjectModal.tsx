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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ClipboardList,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { createProject } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import { getTeamMembers } from "@/app/actions/team";
import { getWorkflowTemplates } from "@/app/actions/templates";
import { createRecurringWork } from "@/app/actions/workflows";

type StartingPoint = "scratch" | "template" | "new-template" | null;
type RecurringOption = "not-recurring" | "weekly" | "biweekly" | "monthly" | "quarterly" | "annually";
type AccountingPeriod = "" | "Q1" | "Q2" | "Q3" | "Q4" | "FY2024" | "FY2025";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  approvalStatus: string;
  activeProjects: number;
  totalProjects: number;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Template {
  id: string;
  name: string;
  description?: string | null;
}

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"starting-point" | "details" | "template-select">("starting-point");
  const [startingPoint, setStartingPoint] = useState<StartingPoint>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Data from server
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);

  // Form state
  const [projectName, setProjectName] = useState("");
  const [clientId, setClientId] = useState("");  // Deprecated: kept for backward compatibility
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurring, setRecurring] = useState<RecurringOption>("not-recurring");
  const [accountingPeriod, setAccountingPeriod] = useState<AccountingPeriod>("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [autoAddToUnassigned, setAutoAddToUnassigned] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");

  // Load data on mount
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  async function loadData() {
    const [clientsData, teamData, templatesData] = await Promise.all([
      getClients(),
      getTeamMembers(),
      getWorkflowTemplates(),
    ]);
    
    setClients(clientsData);
    setTeamMembers(teamData);
    setTemplates(templatesData);
    
    // Set current user as default assignee (first user for now)
    if (teamData.length > 0) {
      const firstUser = teamData[0];
      setCurrentUser(firstUser);
      setSelectedAssignees([firstUser.id]);
    }
  }

  function handleSelectStartingPoint(point: StartingPoint) {
    setStartingPoint(point);
    if (point === "template") {
      setStep("template-select");
    } else if (point === "scratch") {
      setStep("details");
    } else if (point === "new-template") {
      // Navigate to workflow templates page
      onOpenChange(false);
      router.push("/workflows");
    }
  }

  function handleSelectTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    setStep("details");
  }

  function handleBack() {
    if (step === "details") {
      if (startingPoint === "template") {
        setStep("template-select");
      } else {
        setStep("starting-point");
      }
    } else if (step === "template-select") {
      setStep("starting-point");
    }
  }

  function handleClose() {
    // Reset state
    setStep("starting-point");
    setStartingPoint(null);
    setProjectName("");
    setClientId("");
    setSelectedClientIds([]);
    setClientSearch("");
    setStartDate("");
    setDueDate("");
    setRecurring("not-recurring");
    setAccountingPeriod("");
    setSelectedAssignees(currentUser ? [currentUser.id] : []);
    setAutoAddToUnassigned(true);
    setSelectedTemplateId("");
    setShowMoreOptions(false);
    onOpenChange(false);
  }

  function toggleAssignee(userId: string) {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  function removeAssignee(userId: string) {
    setSelectedAssignees((prev) => prev.filter((id) => id !== userId));
  }

  function toggleClient(clientId: string) {
    setSelectedClientIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  }

  function removeClient(clientId: string) {
    setSelectedClientIds((prev) => prev.filter((id) => id !== clientId));
  }

  async function handleCreate() {
    if (!projectName.trim() || selectedClientIds.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // If recurring is selected, create recurring work for each client
      if (recurring !== "not-recurring") {
        // Map recurring option to frequency
        const frequencyMap: Record<string, string> = {
          "weekly": "WEEKLY",
          "biweekly": "BIWEEKLY",
          "monthly": "MONTHLY",
          "quarterly": "QUARTERLY",
          "annually": "ANNUALLY",
        };

        const frequency = frequencyMap[recurring];
        
        // Create recurring work for each selected client
        for (const clientId of selectedClientIds) {
          await createRecurringWork({
            name: projectName,
            description: undefined,
            projectType: "OTHER",
            frequency,
            interval: 1,
            startDate: startDate || new Date().toISOString().split('T')[0],
            endDate: undefined,
            clientId,
            templateId: selectedTemplateId || undefined,
            assigneeId: selectedAssignees.length > 0 ? selectedAssignees[0] : undefined,
            autoAssign: autoAddToUnassigned,
          });
        }

        handleClose();
        router.push("/projects");
      } else {
        // Create regular project(s)
        const projectData = {
          name: projectName,
          clientIds: selectedClientIds,
          type: "OTHER",
          startDate: startDate || undefined,
          dueDate: dueDate || undefined,
          assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
          templateId: selectedTemplateId || undefined,
        };
        
        const result = await createProject(projectData);

        if (result.success && result.project) {
          handleClose();
          router.push(`/projects/${result.project.id}`);
        } else {
          console.error("Failed to create project:", result.error);
          alert("Failed to create project: " + result.error);
        }
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredTeamMembers = teamMembers.filter(
    (member) =>
      member.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
      member.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        {/* Starting Point Selection */}
        {step === "starting-point" && (
          <>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Select a Starting Point</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-3">
              {/* From Scratch */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">From Scratch</p>
                    <p className="text-sm text-gray-500">Start a new project from scratch</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectStartingPoint("scratch")}
                >
                  Select Option
                </Button>
              </div>

              {/* From Template */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">From Template</p>
                    <p className="text-sm text-gray-500">Use a pre-existing template</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectStartingPoint("template")}
                >
                  Select Option
                </Button>
              </div>

              {/* New Template */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">New Template</p>
                    <p className="text-sm text-gray-500">Create a new template</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectStartingPoint("new-template")}
                >
                  Select Option
                </Button>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        )}

        {/* Template Selection */}
        {step === "template-select" && (
          <>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Select a Template</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-3 max-h-[400px] overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No templates available. Create one first.
                </p>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <ClipboardList className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-sm text-gray-500">{template.description}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Select
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          </>
        )}

        {/* Project Details Form */}
        {step === "details" && (
          <>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-5">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="projectName">
                  Project Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectName"
                  placeholder="Name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              {/* Clients - Multi-select */}
              <div className="space-y-2">
                <Label>
                  Clients<span className="text-red-500">*</span>
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
                <p className="text-xs text-gray-500">Select one or more clients for this project.</p>
              </div>

              {/* Start Date & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    placeholder="Optional"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    placeholder="Optional"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Recurring & Accounting Period */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Recurring
                    <Info className="h-4 w-4 text-emerald-500" />
                  </Label>
                  <Select value={recurring} onValueChange={(v) => setRecurring(v as RecurringOption)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Not recurring" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-recurring">Not recurring</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Automatically recreate this work in the future</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Accounting Period
                    <Info className="h-4 w-4 text-emerald-500" />
                  </Label>
                  <Select value={accountingPeriod || undefined} onValueChange={(v) => setAccountingPeriod(v as AccountingPeriod)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an Option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                      <SelectItem value="FY2024">FY 2024</SelectItem>
                      <SelectItem value="FY2025">FY 2025</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Select the period of time this work is for</p>
                </div>
              </div>

              {/* Assignees */}
              <div className="space-y-2">
                <Label>Assignees</Label>
                <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[42px]">
                  {selectedAssignees.map((userId) => {
                    const user = teamMembers.find((m) => m.id === userId);
                    if (!user) return null;
                    return (
                      <Badge
                        key={userId}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeAssignee(userId)}
                        />
                        {user.name || user.email}
                        {currentUser?.id === userId && " (me)"}
                      </Badge>
                    );
                  })}
                  <input
                    type="text"
                    placeholder="search"
                    className="flex-1 min-w-[100px] outline-none text-sm"
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                  />
                </div>
                {assigneeSearch && (
                  <div className="border rounded-md max-h-[150px] overflow-y-auto">
                    {filteredTeamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          toggleAssignee(member.id);
                          setAssigneeSearch("");
                        }}
                      >
                        <span>{member.name || member.email}</span>
                        {selectedAssignees.includes(member.id) && (
                          <span className="text-blue-600">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-add checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="autoAdd"
                  checked={autoAddToUnassigned}
                  onCheckedChange={(checked) => setAutoAddToUnassigned(checked as boolean)}
                />
                <Label htmlFor="autoAdd" className="text-sm font-normal cursor-pointer">
                  Automatically add {currentUser?.name || "me"} (me) to unassigned tasks.
                </Label>
              </div>

              {/* More Options */}
              <button
                type="button"
                className="flex items-center gap-1 text-blue-600 text-sm font-medium"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
              >
                More Options
                {showMoreOptions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showMoreOptions && (
                <div className="space-y-4 pt-2 border-t">
                  <p className="text-sm text-gray-500">
                    Additional options can be configured here (priority, budget, notes, etc.)
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleCreate();
                }}
                disabled={!projectName.trim() || selectedClientIds.length === 0 || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
            {(!projectName.trim() || selectedClientIds.length === 0) && (
              <p className="px-6 pb-4 text-xs text-red-500">
                {!projectName.trim() && "Project name is required. "}
                {selectedClientIds.length === 0 && "Please select at least one client."}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
