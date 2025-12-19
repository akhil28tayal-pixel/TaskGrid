"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Users,
  UserCircle,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  List,
  Paperclip,
  Settings,
  Zap,
} from "lucide-react";
import {
  addTemplateSection,
  addTemplateTask,
  updateTemplateSection,
  deleteTemplateSection,
  duplicateTemplateSection,
  deleteTemplateTask,
  deleteWorkflowTemplate,
} from "@/app/actions/templates";
import { TaskDetailPanel } from "./TaskDetailPanel";

interface TemplateEditorProps {
  template: any;
}

export function TemplateEditor({ template }: TemplateEditorProps) {
  const router = useRouter();
  const [sections, setSections] = useState(template.sections || []);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(template.sections?.map((s: any) => s.id) || [])
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");
  const [addingTaskToSection, setAddingTaskToSection] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("list");

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleAddSection = async (taskType: "TEAM_TASK" | "CLIENT_REQUEST") => {
    const name = taskType === "TEAM_TASK" ? "Team Tasks" : "Client Request";
    const maxOrder = sections.length > 0 
      ? Math.max(...sections.map((s: any) => s.order)) 
      : 0;

    const result = await addTemplateSection(template.id, {
      name,
      order: maxOrder + 1,
    });

    if (result.success && result.section) {
      setSections([...sections, { ...result.section, tasks: [] }]);
      setExpandedSections(new Set([...Array.from(expandedSections), result.section.id]));
    }
  };

  const handleRenameSection = async (sectionId: string) => {
    if (!editingSectionName.trim()) return;

    const result = await updateTemplateSection(sectionId, {
      name: editingSectionName.trim(),
    });

    if (result.success) {
      setSections(
        sections.map((s: any) =>
          s.id === sectionId ? { ...s, name: editingSectionName.trim() } : s
        )
      );
    }
    setEditingSectionId(null);
    setEditingSectionName("");
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section and all its tasks?")) {
      return;
    }

    const result = await deleteTemplateSection(sectionId);
    if (result.success) {
      setSections(sections.filter((s: any) => s.id !== sectionId));
    }
  };

  const handleDuplicateSection = async (sectionId: string) => {
    const result = await duplicateTemplateSection(sectionId);
    if (result.success) {
      router.refresh();
    }
  };

  const handleAddTask = async (sectionId: string, taskType: "TEAM_TASK" | "CLIENT_REQUEST") => {
    if (!newTaskTitle.trim()) return;

    const section = sections.find((s: any) => s.id === sectionId);
    const maxOrder = section?.tasks?.length > 0
      ? Math.max(...section.tasks.map((t: any) => t.order))
      : 0;

    const result = await addTemplateTask(sectionId, {
      title: newTaskTitle.trim(),
      order: maxOrder + 1,
      taskType,
    });

    if (result.success && result.task) {
      setSections(
        sections.map((s: any) =>
          s.id === sectionId
            ? { ...s, tasks: [...(s.tasks || []), { ...result.task, subtasks: [], automations: [], attachments: [] }] }
            : s
        )
      );
      setNewTaskTitle("");
      setAddingTaskToSection(null);
    }
  };

  const handleDeleteTask = async (taskId: string, sectionId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    const result = await deleteTemplateTask(taskId);
    if (result.success) {
      setSections(
        sections.map((s: any) =>
          s.id === sectionId
            ? { ...s, tasks: s.tasks.filter((t: any) => t.id !== taskId) }
            : s
        )
      );
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    }
  };

  const handleTaskClick = (task: any, section: any) => {
    setSelectedTask({ ...task, section });
  };

  const handleTaskDeletedFromPanel = (taskId: string, sectionId: string) => {
    setSections(
      sections.map((s: any) =>
        s.id === sectionId
          ? { ...s, tasks: s.tasks.filter((t: any) => t.id !== taskId) }
          : s
      )
    );
    setSelectedTask(null);
  };

  const handleTaskUpdatedFromPanel = (taskId: string, sectionId: string, updates: any) => {
    setSections(
      sections.map((s: any) =>
        s.id === sectionId
          ? {
              ...s,
              tasks: s.tasks.map((t: any) =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
            }
          : s
      )
    );
    // Update selectedTask as well
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, ...updates });
    }
  };

  const refreshTemplate = () => {
    router.refresh();
  };

  const handleDeleteTemplate = async () => {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      return;
    }

    const result = await deleteWorkflowTemplate(template.id);
    if (result.success) {
      router.push("/workflows");
    } else {
      alert(result.error || "Failed to delete template");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/workflows">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{template.name}</h1>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Template
                  </Badge>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={handleDeleteTemplate}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Create Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" /> List
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" /> Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            {/* Add Section Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSection("TEAM_TASK")}
                className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4 mr-1" /> Team Tasks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSection("CLIENT_REQUEST")}
                className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4 mr-1" /> Client Request
              </Button>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {sections.map((section: any) => (
                <div key={section.id} className="bg-white rounded-lg border shadow-sm">
                  <Collapsible
                    open={expandedSections.has(section.id)}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center justify-between p-3 border-b">
                      <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        {editingSectionId === section.id ? (
                          <Input
                            value={editingSectionName}
                            onChange={(e) => setEditingSectionName(e.target.value)}
                            onBlur={() => handleRenameSection(section.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameSection(section.id);
                              if (e.key === "Escape") {
                                setEditingSectionId(null);
                                setEditingSectionName("");
                              }
                            }}
                            className="h-7 w-48"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-medium">{section.name}</span>
                        )}
                      </CollapsibleTrigger>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingSectionId(section.id);
                              setEditingSectionName(section.name);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Rename Section
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateSection(section.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate Section
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteSection(section.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Section
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CollapsibleContent>
                      <div className="p-3 space-y-2">
                        {/* Tasks */}
                        {section.tasks?.map((task: any) => (
                          <div key={task.id} className="space-y-1">
                            <div
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                              onClick={() => handleTaskClick(task, section)}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {task.taskType === "TEAM_TASK" ? (
                                  <Users className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <UserCircle className="h-4 w-4 text-orange-500" />
                                )}
                                <span className="text-sm">{task.title}</span>
                                {task.automations?.length > 0 && (
                                  <Zap className="h-3 w-3 text-yellow-500" />
                                )}
                                {task.attachments?.length > 0 && (
                                  <Paperclip className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id, section.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                            {/* Subtasks displayed below task */}
                            {task.subtasks?.length > 0 && (
                              <div className="ml-8 pl-4 border-l-2 border-gray-200 space-y-1">
                                {task.subtasks.map((subtask: any) => (
                                  <div
                                    key={subtask.id}
                                    className="flex items-center gap-2 py-1 px-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => handleTaskClick(task, section)}
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-gray-400" />
                                    <span>{subtask.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add Task Input */}
                        {addingTaskToSection === section.id ? (
                          <div className="flex items-center gap-2 p-2">
                            <Input
                              placeholder="Task title..."
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddTask(
                                    section.id,
                                    section.name.toLowerCase().includes("client")
                                      ? "CLIENT_REQUEST"
                                      : "TEAM_TASK"
                                  );
                                }
                                if (e.key === "Escape") {
                                  setAddingTaskToSection(null);
                                  setNewTaskTitle("");
                                }
                              }}
                              autoFocus
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() =>
                                handleAddTask(
                                  section.id,
                                  section.name.toLowerCase().includes("client")
                                    ? "CLIENT_REQUEST"
                                    : "TEAM_TASK"
                                )
                              }
                            >
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setAddingTaskToSection(null);
                                setNewTaskTitle("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <button
                            className="flex items-center gap-2 p-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg w-full"
                            onClick={() => setAddingTaskToSection(section.id)}
                          >
                            <Plus className="h-4 w-4" />
                            Add task...
                          </button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}

              {sections.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <List className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
                  <p className="text-gray-500 mb-4">
                    Add a section to start building your template
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => handleAddSection("TEAM_TASK")}
                      className="border-emerald-500 text-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Team Tasks
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddSection("CLIENT_REQUEST")}
                      className="border-emerald-500 text-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Client Request
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Add Section Buttons */}
            {sections.length > 0 && (
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSection("TEAM_TASK")}
                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4 mr-1" /> Team Tasks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSection("CLIENT_REQUEST")}
                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4 mr-1" /> Client Request
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <div className="bg-white rounded-lg border p-8 text-center">
              <Paperclip className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Template Files</h3>
              <p className="text-gray-500">
                Files attached to tasks will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskDeleted={() => handleTaskDeletedFromPanel(selectedTask.id, selectedTask.section.id)}
          onTaskUpdated={(updates: any) => handleTaskUpdatedFromPanel(selectedTask.id, selectedTask.section.id, updates)}
        />
      )}
    </div>
  );
}
