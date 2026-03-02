"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Tag,
  Calendar,
  ChevronDown,
  Users,
  Check,
  X,
  Clock,
  MessageSquare,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ProjectTag {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  taskType: string;
  dueDate: Date | null;
  completedAt: Date | null;
  project: {
    id: string;
    name: string;
    dueDate: Date | null;
    client: {
      id: string;
      name: string;
    } | null;
    tag: ProjectTag | null;
  };
  assignee: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  } | null;
  subtaskCount: number;
  completedSubtaskCount: number;
  commentCount: number;
}

interface Filters {
  tags: ProjectTag[];
  clients: { id: string; name: string }[];
  assignees: { id: string; name: string | null; email: string; avatar: string | null }[];
}

interface TasksPageClientProps {
  initialTasks: Task[];
  filters: Filters;
}

type StatusFilter = "all" | "pending" | "completed";

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    TODO: "bg-slate-200",
    IN_PROGRESS: "bg-blue-500",
    COMPLETED: "bg-green-500",
    BLOCKED: "bg-red-500",
  };
  return colors[status] || "bg-slate-200";
}

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getAccountingPeriod(date: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function getInitials(name: string | null | undefined, email?: string) {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function TasksPageClient({ initialTasks, filters }: TasksPageClientProps) {
  // Filter states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [dueDateFilter, setDueDateFilter] = useState<string>("");

  // Popover states
  const [tagsOpen, setTagsOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return initialTasks.filter((task) => {
      // Status filter
      if (statusFilter === "pending" && task.status === "COMPLETED") {
        return false;
      }
      if (statusFilter === "completed" && task.status !== "COMPLETED") {
        return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        if (!task.project.tag || !selectedTags.includes(task.project.tag.id)) {
          return false;
        }
      }

      // Client filter
      if (selectedClients.length > 0) {
        if (!task.project.client || !selectedClients.includes(task.project.client.id)) {
          return false;
        }
      }

      // Assignee filter
      if (selectedAssignees.length > 0) {
        if (!task.assignee || !selectedAssignees.includes(task.assignee.id)) {
          return false;
        }
      }

      // Due date filter
      if (dueDateFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;

        if (dueDateFilter === "overdue") {
          if (!dueDate || dueDate >= today) {
            return false;
          }
        }
        if (dueDateFilter === "this_week") {
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          if (!dueDate || dueDate < today || dueDate > weekEnd) {
            return false;
          }
        }
        if (dueDateFilter === "this_month") {
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          if (!dueDate || dueDate < today || dueDate > monthEnd) {
            return false;
          }
        }
      }

      return true;
    });
  }, [initialTasks, statusFilter, selectedTags, selectedClients, selectedAssignees, dueDateFilter]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const toggleAssignee = (assigneeId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(assigneeId) ? prev.filter((id) => id !== assigneeId) : [...prev, assigneeId]
    );
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setSelectedClients([]);
    setSelectedAssignees([]);
    setStatusFilter("pending");
    setDueDateFilter("");
  };

  const hasActiveFilters = selectedTags.length > 0 || selectedClients.length > 0 || selectedAssignees.length > 0 || dueDateFilter !== "" || statusFilter !== "pending";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-slate-500 mt-1">View and manage your assigned tasks</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 pb-4">
        {/* Tags Filter */}
        <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={selectedTags.length > 0 ? "text-blue-600 border-blue-600" : "text-gray-600"}>
              <Tag className="mr-1 h-3 w-3" />
              {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : "Tags"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filters.tags.length === 0 ? (
                <p className="text-sm text-gray-500 px-3 py-2">No tags</p>
              ) : (
                filters.tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${selectedTags.includes(tag.id) ? "bg-gray-100" : ""}`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                    {selectedTags.includes(tag.id) && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                ))
              )}
            </div>
            {selectedTags.length > 0 && (
              <div className="border-t mt-2 pt-2">
                <button
                  className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  onClick={() => { setSelectedTags([]); setTagsOpen(false); }}
                >
                  Clear selection
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Due Date Filter */}
        <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={dueDateFilter ? "text-blue-600 border-blue-600" : "text-gray-600"}>
              <Calendar className="mr-1 h-3 w-3" />
              {dueDateFilter === "overdue" ? "Overdue" : dueDateFilter === "this_week" ? "This Week" : dueDateFilter === "this_month" ? "This Month" : "Due Date"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {["overdue", "this_week", "this_month"].map((option) => (
                <button
                  key={option}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${dueDateFilter === option ? "bg-gray-100" : ""}`}
                  onClick={() => { setDueDateFilter(dueDateFilter === option ? "" : option); setDueDateOpen(false); }}
                >
                  {option === "overdue" ? "Overdue" : option === "this_week" ? "This Week" : "This Month"}
                  {dueDateFilter === option && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-600">
              {statusFilter === "all" ? "All" : statusFilter === "pending" ? "Pending" : "Completed"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start">
            <div className="space-y-1">
              {(["pending", "completed", "all"] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${statusFilter === status ? "bg-gray-100" : ""}`}
                  onClick={() => { setStatusFilter(status); setStatusOpen(false); }}
                >
                  {status === "all" ? "All" : status === "pending" ? "Pending" : "Completed"}
                  {statusFilter === status && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Assignee Filter */}
        <Popover open={assigneesOpen} onOpenChange={setAssigneesOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={selectedAssignees.length > 0 ? "text-blue-600 border-blue-600" : "text-gray-600"}>
              <Users className="mr-1 h-3 w-3" />
              {selectedAssignees.length > 0 ? `Assignee (${selectedAssignees.length})` : "Assignee"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filters.assignees.length === 0 ? (
                <p className="text-sm text-gray-500 px-3 py-2">No assignees</p>
              ) : (
                filters.assignees.map((assignee) => (
                  <button
                    key={assignee.id}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${selectedAssignees.includes(assignee.id) ? "bg-gray-100" : ""}`}
                    onClick={() => toggleAssignee(assignee.id)}
                  >
                    {assignee.name || assignee.email}
                    {selectedAssignees.includes(assignee.id) && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                ))
              )}
            </div>
            {selectedAssignees.length > 0 && (
              <div className="border-t mt-2 pt-2">
                <button
                  className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  onClick={() => { setSelectedAssignees([]); setAssigneesOpen(false); }}
                >
                  Clear selection
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Clients Filter */}
        <Popover open={clientsOpen} onOpenChange={setClientsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={selectedClients.length > 0 ? "text-blue-600 border-blue-600" : "text-gray-600"}>
              <Users className="mr-1 h-3 w-3" />
              {selectedClients.length > 0 ? `Clients (${selectedClients.length})` : "Clients"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filters.clients.length === 0 ? (
                <p className="text-sm text-gray-500 px-3 py-2">No clients</p>
              ) : (
                filters.clients.map((client) => (
                  <button
                    key={client.id}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${selectedClients.includes(client.id) ? "bg-gray-100" : ""}`}
                    onClick={() => toggleClient(client.id)}
                  >
                    {client.name}
                    {selectedClients.includes(client.id) && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                ))
              )}
            </div>
            {selectedClients.length > 0 && (
              <div className="border-t mt-2 pt-2">
                <button
                  className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  onClick={() => { setSelectedClients([]); setClientsOpen(false); }}
                >
                  Clear selection
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={clearAllFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear Filters
          </Button>
        )}

        {/* Results count */}
        <span className="text-sm text-gray-500 ml-auto">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tasks found.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_80px_60px_60px_200px_120px_120px_80px] gap-3 px-4 py-3.5 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <div className="flex items-center">
              <Checkbox />
            </div>
            <div>Task Name</div>
            <div className="text-center">
              <CheckSquare className="h-4 w-4 mx-auto" />
            </div>
            <div className="text-center">
              <MessageSquare className="h-4 w-4 mx-auto" />
            </div>
            <div>Due</div>
            <div>Project</div>
            <div>Client</div>
            <div>Actual / Budgeted</div>
            <div className="text-center">Assignees</div>
          </div>

          {/* Table Body */}
          {filteredTasks.map((task) => (
            <Link
              key={task.id}
              href={`/projects/${task.project.id}`}
              className="grid grid-cols-[40px_1fr_80px_60px_60px_200px_120px_120px_80px] gap-3 px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50/50 items-center text-sm transition-colors"
            >
              <div className="flex items-center" onClick={(e) => e.preventDefault()}>
                <Checkbox />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(task.status)}`} />
                <span className="font-medium text-slate-900 truncate">{task.title}</span>
              </div>
              <div className="text-slate-500 text-center">
                {task.subtaskCount > 0 ? (
                  <span className="flex items-center justify-center gap-1">
                    <CheckSquare className="h-3.5 w-3.5" />
                    {task.completedSubtaskCount}/{task.subtaskCount}
                  </span>
                ) : "-"}
              </div>
              <div className="text-slate-500 text-center">
                {task.commentCount > 0 ? (
                  <span className="flex items-center justify-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {task.commentCount}
                  </span>
                ) : "-"}
              </div>
              <div className="text-slate-700">
                {formatDate(task.dueDate)}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-slate-900 truncate">{task.project.name}</span>
                <span className="text-xs text-slate-500 flex-shrink-0">{getAccountingPeriod(task.project.dueDate)}</span>
              </div>
              <div className="text-slate-700 truncate">
                {task.project.client?.name || 'No Client'}
              </div>
              <div className="text-slate-500">
                0h 0m / 0h 0m
              </div>
              <div className="flex justify-center">
                {task.assignee ? (
                  <Avatar className="h-7 w-7 border-2 border-white">
                    <AvatarFallback className="text-xs bg-rose-500 text-white">
                      {getInitials(task.assignee.name, task.assignee.email)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
