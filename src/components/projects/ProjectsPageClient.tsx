"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  RefreshCw,
  Tag,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CreateProjectModal } from "./CreateProjectModal";

interface ProjectTag {
  id: string;
  name: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  status: string;
  priority: string;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  client: {
    id: string;
    name: string;
  };
  tag?: ProjectTag | null;
  assignees: Array<{
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    role: string;
  }>;
  clientTaskCount: number;
  completedClientTaskCount: number;
}

interface ProjectsPageClientProps {
  initialProjects: Project[];
}

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateFull(date: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string | null, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function getAccountingPeriod(date: Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear().toString().slice(-2);
  return `${month} '${year}`;
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NOT_STARTED: "bg-gray-200",
    IN_PROGRESS: "bg-blue-400",
    WAITING_FOR_CLIENT: "bg-yellow-400",
    IN_REVIEW: "bg-purple-400",
    COMPLETED: "bg-green-400",
  };
  return colors[status] || "bg-gray-200";
}

type StatusFilter = "all" | "open" | "completed" | "on_hold";

export function ProjectsPageClient({ initialProjects }: ProjectsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter states
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [dueDateFilter, setDueDateFilter] = useState<string>("");
  const [showCurrentAssigneeOnly, setShowCurrentAssigneeOnly] = useState(false);
  
  // Popover open states
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  // Sorting states
  type SortField = "dueDate" | "nextTaskDue" | null;
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get unique clients and assignees for filter options
  const uniqueClients = useMemo(() => {
    const clients = new Map<string, string>();
    initialProjects.forEach((p) => clients.set(p.client.id, p.client.name));
    return Array.from(clients.entries()).map(([id, name]) => ({ id, name }));
  }, [initialProjects]);

  const uniqueAssignees = useMemo(() => {
    const assignees = new Map<string, { id: string; name: string }>();
    initialProjects.forEach((p) => {
      p.assignees.forEach((a) => {
        assignees.set(a.id, { id: a.id, name: a.name || a.email });
      });
    });
    return Array.from(assignees.values());
  }, [initialProjects]);

  const uniqueTags = useMemo(() => {
    const tags = new Map<string, { id: string; name: string; color: string }>();
    initialProjects.forEach((p) => {
      if (p.tag) {
        tags.set(p.tag.id, { id: p.tag.id, name: p.tag.name, color: p.tag.color });
      }
    });
    return Array.from(tags.values());
  }, [initialProjects]);

  // Apply filters
  const filteredProjects = useMemo(() => {
    return initialProjects.filter((project) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !project.name.toLowerCase().includes(query) &&
          !project.client.name.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Client filter
      if (selectedClients.length > 0 && !selectedClients.includes(project.client.id)) {
        return false;
      }

      // Assignee filter
      if (selectedAssignees.length > 0) {
        const projectAssigneeIds = project.assignees.map((a) => a.id);
        if (!selectedAssignees.some((id) => projectAssigneeIds.includes(id))) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === "open") {
        if (project.status === "COMPLETED" || project.status === "CANCELLED" || project.status === "ON_HOLD") {
          return false;
        }
      } else if (statusFilter === "completed") {
        if (project.status !== "COMPLETED") {
          return false;
        }
      } else if (statusFilter === "on_hold") {
        if (project.status !== "ON_HOLD") {
          return false;
        }
      }

      // Due date filter
      if (dueDateFilter) {
        const today = new Date();
        const dueDate = project.dueDate ? new Date(project.dueDate) : null;
        
        if (dueDateFilter === "overdue" && (!dueDate || dueDate >= today)) {
          return false;
        }
        if (dueDateFilter === "this_week") {
          const weekEnd = new Date(today);
          weekEnd.setDate(today.getDate() + 7);
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

      // Tag filter
      if (selectedTags.length > 0) {
        if (!project.tag || !selectedTags.includes(project.tag.id)) {
          return false;
        }
      }

      return true;
    });
  }, [initialProjects, searchQuery, selectedClients, selectedAssignees, statusFilter, dueDateFilter, selectedTags]);

  // Apply sorting
  const sortedProjects = useMemo(() => {
    if (!sortField) return filteredProjects;
    
    return [...filteredProjects].sort((a, b) => {
      let dateA: Date | null = null;
      let dateB: Date | null = null;
      
      if (sortField === "dueDate") {
        dateA = a.dueDate ? new Date(a.dueDate) : null;
        dateB = b.dueDate ? new Date(b.dueDate) : null;
      }
      // nextTaskDue would need task data - for now treat as null
      
      // Handle nulls - put them at the end
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      const comparison = dateA.getTime() - dateB.getTime();
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredProjects, sortField, sortDirection]);

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

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const clearAllFilters = () => {
    setSelectedClients([]);
    setSelectedAssignees([]);
    setSelectedTags([]);
    setStatusFilter("open");
    setDueDateFilter("");
    setShowCurrentAssigneeOnly(false);
  };

  const hasActiveFilters = selectedClients.length > 0 || selectedAssignees.length > 0 || selectedTags.length > 0 || dueDateFilter !== "" || statusFilter !== "open";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1">Track and manage all client projects</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 pb-4">
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
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${dueDateFilter === "" ? "bg-gray-100" : ""}`}
                onClick={() => { setDueDateFilter(""); setDueDateOpen(false); }}
              >
                All Dates
                {dueDateFilter === "" && <Check className="h-4 w-4 text-blue-600" />}
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${dueDateFilter === "overdue" ? "bg-gray-100" : ""}`}
                onClick={() => { setDueDateFilter("overdue"); setDueDateOpen(false); }}
              >
                Overdue
                {dueDateFilter === "overdue" && <Check className="h-4 w-4 text-blue-600" />}
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${dueDateFilter === "this_week" ? "bg-gray-100" : ""}`}
                onClick={() => { setDueDateFilter("this_week"); setDueDateOpen(false); }}
              >
                This Week
                {dueDateFilter === "this_week" && <Check className="h-4 w-4 text-blue-600" />}
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${dueDateFilter === "this_month" ? "bg-gray-100" : ""}`}
                onClick={() => { setDueDateFilter("this_month"); setDueDateOpen(false); }}
              >
                This Month
                {dueDateFilter === "this_month" && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Assignee Filter */}
        <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={selectedAssignees.length > 0 ? "text-blue-600 border-blue-600" : "text-gray-600"}>
              <Users className="mr-1 h-3 w-3" />
              {selectedAssignees.length > 0 ? `Assignee (${selectedAssignees.length})` : "Assignee"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {uniqueAssignees.length === 0 ? (
                <p className="text-sm text-gray-500 px-3 py-2">No assignees</p>
              ) : (
                uniqueAssignees.map((assignee) => (
                  <button
                    key={assignee.id}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${selectedAssignees.includes(assignee.id) ? "bg-gray-100" : ""}`}
                    onClick={() => { toggleAssignee(assignee.id); setAssigneeOpen(false); }}
                  >
                    {assignee.name}
                    {selectedAssignees.includes(assignee.id) && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                ))
              )}
            </div>
            {selectedAssignees.length > 0 && (
              <div className="border-t mt-2 pt-2">
                <button
                  className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  onClick={() => { setSelectedAssignees([]); setAssigneeOpen(false); }}
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
              {uniqueClients.length === 0 ? (
                <p className="text-sm text-gray-500 px-3 py-2">No clients</p>
              ) : (
                uniqueClients.map((client) => (
                  <button
                    key={client.id}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${selectedClients.includes(client.id) ? "bg-gray-100" : ""}`}
                    onClick={() => { toggleClient(client.id); setClientsOpen(false); }}
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
              {uniqueTags.length === 0 ? (
                <p className="text-sm text-gray-500 px-3 py-2">No tags</p>
              ) : (
                uniqueTags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${selectedTags.includes(tag.id) ? "bg-gray-100" : ""}`}
                    onClick={() => { toggleTag(tag.id); setTagsOpen(false); }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
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

        {/* Status Filter */}
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-600">
              {statusFilter === "all" ? "All" : statusFilter === "open" ? "Open" : statusFilter === "completed" ? "Completed" : "On Hold"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start">
            <div className="space-y-1">
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${statusFilter === "all" ? "bg-gray-100" : ""}`}
                onClick={() => { setStatusFilter("all"); setStatusOpen(false); }}
              >
                All
                {statusFilter === "all" && <Check className="h-4 w-4 text-blue-600" />}
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${statusFilter === "open" ? "bg-gray-100" : ""}`}
                onClick={() => { setStatusFilter("open"); setStatusOpen(false); }}
              >
                Open
                {statusFilter === "open" && <Check className="h-4 w-4 text-blue-600" />}
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${statusFilter === "completed" ? "bg-gray-100" : ""}`}
                onClick={() => { setStatusFilter("completed"); setStatusOpen(false); }}
              >
                Completed
                {statusFilter === "completed" && <Check className="h-4 w-4 text-blue-600" />}
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${statusFilter === "on_hold" ? "bg-gray-100" : ""}`}
                onClick={() => { setStatusFilter("on_hold"); setStatusOpen(false); }}
              >
                On Hold
                {statusFilter === "on_hold" && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            </div>
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
          {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchQuery ? "No projects match your search." : "No projects yet. Create your first project!"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_120px_1fr_80px_80px_90px_100px_100px_80px] gap-3 px-4 py-3.5 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <div className="flex items-center">
              <Checkbox />
            </div>
            <div className="flex items-center gap-1">
              Client
              <ChevronDown className="h-3 w-3" />
            </div>
            <div className="flex items-center gap-1">
              Project
              <ChevronDown className="h-3 w-3" />
            </div>
            <div className="text-center">Team Chat</div>
            <div className="text-center">Client Tasks</div>
            <div>Start Date</div>
            <button
              onClick={() => handleSort("nextTaskDue")}
              className={`flex items-center gap-1 cursor-pointer ${sortField === "nextTaskDue" ? "text-gray-900" : "hover:text-gray-700"}`}
            >
              Next Task Due
              <ChevronDown className={`h-3 w-3 transition-transform ${sortField === "nextTaskDue" && sortDirection === "asc" ? "rotate-180" : ""} ${sortField !== "nextTaskDue" ? "opacity-40" : ""}`} />
            </button>
            <button
              onClick={() => handleSort("dueDate")}
              className={`flex items-center gap-1 cursor-pointer ${sortField === "dueDate" ? "text-gray-900" : "hover:text-gray-700"}`}
            >
              Due Date
              <ChevronDown className={`h-3 w-3 transition-transform ${sortField === "dueDate" && sortDirection === "asc" ? "rotate-180" : ""} ${sortField !== "dueDate" ? "opacity-40" : ""}`} />
            </button>
            <div className="text-center">Assignees</div>
          </div>

          {/* Table Body */}
          {sortedProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="grid grid-cols-[40px_120px_1fr_80px_80px_90px_100px_100px_80px] gap-3 px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50/50 items-center text-sm transition-colors"
            >
              <div className="flex items-center" onClick={(e) => e.preventDefault()}>
                <Checkbox />
              </div>
              <div className="font-medium text-gray-900 truncate">
                {project.client.name}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-gray-900 truncate">{project.name}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">{getAccountingPeriod(project.dueDate)}</span>
                  <RefreshCw className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  {project.tag && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: project.tag.color }}
                      />
                      <span className="text-xs text-gray-600">{project.tag.name}</span>
                    </div>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(project.status)}`}
                    style={{ width: project.status === "COMPLETED" ? "100%" : project.status === "IN_PROGRESS" ? "50%" : "10%" }}
                  />
                </div>
              </div>
              <div className="text-gray-500 text-center">-</div>
              <div className="text-gray-500 text-center">
                {project.clientTaskCount > 0 ? `${project.completedClientTaskCount}/${project.clientTaskCount}` : "-"}
              </div>
              <div className="text-gray-700">
                {formatDate(project.startDate)}
              </div>
              <div className="text-gray-500 text-center">-</div>
              <div className="text-gray-700">
                {formatDateFull(project.dueDate)}
              </div>
              <div className="flex -space-x-1 justify-center">
                {project.assignees.slice(0, 2).map((assignee) => (
                  <Avatar key={assignee.id} className="h-7 w-7 border-2 border-white">
                    <AvatarFallback className="text-xs bg-rose-500 text-white">
                      {getInitials(assignee.name, assignee.email)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.assignees.length > 2 && (
                  <Avatar className="h-7 w-7 border-2 border-white">
                    <AvatarFallback className="text-xs bg-gray-400 text-white">
                      +{project.assignees.length - 2}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
