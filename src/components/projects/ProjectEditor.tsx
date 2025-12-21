"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Users,
  UserCircle,
  Edit,
  Trash2,
  CheckCircle2,
  List,
  Paperclip,
  Calendar,
  Clock,
  X,
  Zap,
  Save,
  Loader2,
  Upload,
  Send,
  Download,
  MessageSquare,
  Settings,
  Eye,
  RefreshCw,
} from "lucide-react";
import { getTeamMembers } from "@/app/actions/team";
import {
  addProjectTask,
  updateProjectTask,
  deleteProjectTask,
  getProjectTasks,
  updateProject,
  sendClientTaskNotification,
} from "@/app/actions/projects";
import {
  getTaskComments,
  addTaskComment,
  getTaskAttachments,
  addTaskAttachment,
  deleteTaskAttachment,
} from "@/app/actions/tasks";
import { getTaskDocuments, downloadDocument } from "@/app/actions/client-file-upload";
import { teamUploadDocumentForClient, getTeamDocumentsForTask, updateTaskQuestion, deleteTeamDocument } from "@/app/actions/team-document-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientTaskWizard } from "@/components/workflows/ClientTaskWizard";
import { ProjectTagSelector } from "@/components/projects/ProjectTagSelector";

interface ProjectTag {
  id: string;
  name: string;
  color: string;
}

interface ProjectEditorProps {
  project: any;
  userRole?: string;
}

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Section {
  id: string;
  name: string;
  type: "TEAM_TASK" | "CLIENT_REQUEST";
  tasks: Task[];
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date;
  subtasks: Subtask[];
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  taskType?: "TEAM_TASK" | "CLIENT_REQUEST";
  question?: string;
  answer?: string;
  answeredAt?: Date;
}

export function ProjectEditor({ project, userRole = "ASSOCIATE" }: ProjectEditorProps) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("list");
  const [addingTaskToSection, setAddingTaskToSection] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [projectStatus, setProjectStatus] = useState(project.status || "NOT_STARTED");
  const [showClientTaskWizard, setShowClientTaskWizard] = useState(false);
  const [wizardTargetSectionId, setWizardTargetSectionId] = useState<string | null>(null);
  const [projectTag, setProjectTag] = useState<ProjectTag | null>(project.tag || null);
  
  // Comments and Attachments state
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<any[]>([]);
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [teamDocuments, setTeamDocuments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isUploadingTeamDoc, setIsUploadingTeamDoc] = useState(false);

  // Fetch team members and existing tasks on mount
  useEffect(() => {
    async function fetchData() {
      // Fetch team members
      const members = await getTeamMembers();
      setTeamMembers(members.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
      })));

      // Fetch existing tasks
      const tasksResult = await getProjectTasks(project.id);
      if (tasksResult.success && tasksResult.tasks.length > 0) {
        // Group tasks by taskType
        const teamTasksList: Task[] = [];
        const clientRequestsList: Task[] = [];

        tasksResult.tasks.forEach((t: any) => {
          const task: Task = {
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            dueDate: t.dueDate,
            assigneeId: t.assigneeId,
            assignee: t.assignee ? {
              id: t.assignee.id,
              name: t.assignee.name || t.assignee.email,
              avatar: t.assignee.avatar,
            } : undefined,
            subtasks: (t.subtasks || []).map((st: any) => ({
              id: st.id,
              title: st.title,
              isCompleted: st.status === "COMPLETED",
            })),
            taskType: t.taskType,
            question: t.question,
            answer: t.answer,
            answeredAt: t.answeredAt,
          };

          if (t.taskType === "CLIENT_REQUEST") {
            clientRequestsList.push(task);
          } else {
            teamTasksList.push(task);
          }
        });

        const loadedSections: Section[] = [];
        const expandedIds: string[] = [];

        if (teamTasksList.length > 0) {
          loadedSections.push({
            id: "team-tasks-section",
            name: "Team Tasks",
            type: "TEAM_TASK",
            tasks: teamTasksList,
          });
          expandedIds.push("team-tasks-section");
        }

        if (clientRequestsList.length > 0) {
          loadedSections.push({
            id: "client-request-section",
            name: "Client Request",
            type: "CLIENT_REQUEST",
            tasks: clientRequestsList,
          });
          expandedIds.push("client-request-section");
        }

        if (loadedSections.length > 0) {
          setSections(loadedSections);
          setExpandedSections(new Set(expandedIds));
        }
      }
    }
    fetchData();
  }, [project.id]);

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
    const newSection: Section = {
      id: `temp-${Date.now()}`,
      name,
      type: taskType,
      tasks: [],
    };
    setSections([...sections, newSection]);
    setExpandedSections(new Set([...Array.from(expandedSections), newSection.id]));
    setHasChanges(true);
  };

  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      // Tasks are already saved to database as they're created
      // Just redirect back to projects page
      console.log("Project saved with sections:", sections);
      
      setHasChanges(false);
      router.push("/projects");
    } catch (error) {
      console.error("Failed to save project:", error);
      alert("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskDescriptionChange = async (taskId: string, sectionId: string, description: string) => {
    // Save to database if it's a real task
    if (!taskId.startsWith("temp-")) {
      const result = await updateProjectTask(taskId, { description });
      if (!result.success) {
        alert("Failed to update description: " + (result.error || "Unknown error"));
        return;
      }
    }
    
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === taskId ? { ...t, description } : t
              ),
            }
          : s
      )
    );

    // Update selected task if it's the one being modified
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, description });
    }
  };

  const handleAssigneeChange = async (taskId: string, sectionId: string, assigneeId: string) => {
    const assignee = teamMembers.find((m) => m.id === assigneeId);
    
    // Save to database if it's a real task
    if (!taskId.startsWith("temp-")) {
      const result = await updateProjectTask(taskId, { assigneeId });
      if (!result.success) {
        alert("Failed to update assignee: " + (result.error || "Unknown error"));
        return;
      }
    }
    
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      assigneeId,
                      assignee: assignee
                        ? { id: assignee.id, name: assignee.name || assignee.email, avatar: undefined }
                        : undefined,
                    }
                  : t
              ),
            }
          : s
      )
    );

    // Update selected task if it's the one being modified
    if (selectedTask?.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        assigneeId,
        assignee: assignee
          ? { id: assignee.id, name: assignee.name || assignee.email, avatar: undefined }
          : undefined,
      });
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Fetch comments and attachments when a task is selected
  useEffect(() => {
    async function fetchTaskData() {
      if (selectedTask && !selectedTask.id.startsWith("temp-")) {
        const [commentsResult, attachmentsResult, documentsResult, teamDocsResult] = await Promise.all([
          getTaskComments(selectedTask.id),
          getTaskAttachments(selectedTask.id),
          selectedTask.taskType === "CLIENT_REQUEST" ? getTaskDocuments(selectedTask.id) : Promise.resolve({ success: true, documents: [] }),
          selectedTask.taskType === "CLIENT_REQUEST" ? getTeamDocumentsForTask(selectedTask.id) : Promise.resolve({ success: true, documents: [] }),
        ]);
        if (commentsResult.success) {
          setTaskComments(commentsResult.comments || []);
        }
        if (attachmentsResult.success) {
          setTaskAttachments(attachmentsResult.attachments || []);
        }
        if (documentsResult.success) {
          setClientDocuments(documentsResult.documents || []);
        }
        if (teamDocsResult.success) {
          setTeamDocuments(teamDocsResult.documents || []);
        }
      } else {
        setTaskComments([]);
        setTaskAttachments([]);
        setClientDocuments([]);
        setTeamDocuments([]);
      }
    }
    fetchTaskData();
  }, [selectedTask?.id]);

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim() || selectedTask.id.startsWith("temp-")) return;
    
    setIsAddingComment(true);
    const result = await addTaskComment(selectedTask.id, newComment.trim());
    if (result.success && result.comment) {
      setTaskComments([result.comment, ...taskComments]);
      setNewComment("");
    } else {
      alert("Failed to add comment: " + (result.error || "Unknown error"));
    }
    setIsAddingComment(false);
  };

  // Handle attachment upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || selectedTask.id.startsWith("temp-")) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Convert file to base64 for storage (temporary solution)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const result = await addTaskAttachment(
          selectedTask.id,
          file.name,
          base64String, // Store base64 string instead of blob URL
          file.size,
          file.type
        );
        
        if (result.success && result.attachment) {
          setTaskAttachments([result.attachment, ...taskAttachments]);
        } else {
          alert("Failed to add attachment: " + (result.error || "Unknown error"));
        }
      };
      
      reader.onerror = () => {
        alert("Failed to read file");
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading attachment:", error);
      alert("Failed to upload attachment");
    }
    
    // Reset the input
    e.target.value = "";
  };

  // Handle downloading an attachment
  const handleDownloadAttachment = (attachment: any) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = attachment.fileUrl;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle deleting an attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    const result = await deleteTaskAttachment(attachmentId);
    if (result.success) {
      setTaskAttachments(taskAttachments.filter((a) => a.id !== attachmentId));
    } else {
      alert("Failed to delete attachment: " + (result.error || "Unknown error"));
    }
  };

  // Handle team document upload for SEND_DOCUMENT tasks
  const handleTeamDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || selectedTask.id.startsWith("temp-")) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTeamDoc(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const result = await teamUploadDocumentForClient({
          taskId: selectedTask.id,
          fileName: file.name,
          fileData: base64String,
          fileSize: file.size,
          mimeType: file.type,
        });
        
        if (result.success && result.document) {
          setTeamDocuments([result.document, ...teamDocuments]);
        } else {
          alert("Failed to upload document: " + (result.error || "Unknown error"));
        }
        setIsUploadingTeamDoc(false);
      };
      
      reader.onerror = () => {
        alert("Failed to read file");
        setIsUploadingTeamDoc(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document");
      setIsUploadingTeamDoc(false);
    }
    
    e.target.value = "";
  };

  // Handle deleting a team document
  const handleDeleteTeamDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    const result = await deleteTeamDocument(documentId);
    if (result.success) {
      setTeamDocuments(teamDocuments.filter((d) => d.id !== documentId));
    } else {
      alert("Failed to delete document: " + (result.error || "Unknown error"));
    }
  };

  // Check if all tasks are completed and update project status
  const checkAndUpdateProjectStatus = async (updatedSections: Section[]) => {
    const allTasks = updatedSections.flatMap((s) => s.tasks);
    if (allTasks.length === 0) return;

    const allCompleted = allTasks.every((t) => t.status === "COMPLETED");
    const anyInProgress = allTasks.some((t) => t.status === "IN_PROGRESS" || t.status === "TODO");

    let newStatus = projectStatus;
    if (allCompleted && projectStatus !== "COMPLETED") {
      newStatus = "COMPLETED";
    } else if (anyInProgress && projectStatus === "COMPLETED") {
      newStatus = "IN_PROGRESS";
    } else if (anyInProgress && projectStatus === "NOT_STARTED") {
      newStatus = "IN_PROGRESS";
    }

    if (newStatus !== projectStatus) {
      const result = await updateProject(project.id, { status: newStatus });
      if (result.success) {
        setProjectStatus(newStatus);
        if (newStatus === "COMPLETED") {
          alert("🎉 All tasks completed! Project marked as complete.");
        }
      }
    }
  };

  // Toggle subtask completion
  const handleToggleSubtaskComplete = async (subtaskId: string, taskId: string, sectionId: string, isCompleted: boolean) => {
    const newStatus = isCompleted ? "TODO" : "COMPLETED";

    // Update in database if it's a real subtask
    if (!subtaskId.startsWith("subtask-")) {
      const result = await updateProjectTask(subtaskId, { status: newStatus });
      if (!result.success) {
        alert("Failed to update subtask: " + (result.error || "Unknown error"));
        return;
      }
    }

    const updatedSections = sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    subtasks: t.subtasks.map((st) =>
                      st.id === subtaskId ? { ...st, isCompleted: !isCompleted } : st
                    ),
                  }
                : t
            ),
          }
        : s
    );

    setSections(updatedSections);

    // Update selected task if it's the one being modified
    if (selectedTask?.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        subtasks: selectedTask.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, isCompleted: !isCompleted } : st
        ),
      });
    }
  };

  // Toggle task completion
  const handleToggleTaskComplete = async (taskId: string, sectionId: string, currentStatus: string) => {
    const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED";

    // Update in database if it's a real task
    if (!taskId.startsWith("temp-")) {
      const result = await updateProjectTask(taskId, { status: newStatus });
      if (!result.success) {
        alert("Failed to update task: " + (result.error || "Unknown error"));
        return;
      }
    }

    const updatedSections = sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === taskId ? { ...t, status: newStatus } : t
            ),
          }
        : s
    );

    setSections(updatedSections);

    // Update selected task if it's the one being modified
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }

    // Check if all tasks are completed
    await checkAndUpdateProjectStatus(updatedSections);
  };

  const handleAddTask = async (sectionId: string) => {
    if (!newTaskTitle.trim()) return;

    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    // Save to database with the correct taskType based on section
    const result = await addProjectTask(project.id, {
      title: newTaskTitle.trim(),
      order: section.tasks.length,
      taskType: section.type,
    });

    if (result.success && result.task) {
      const newTask: Task = {
        id: result.task.id,
        title: result.task.title,
        description: result.task.description || undefined,
        status: result.task.status,
        subtasks: [],
        assigneeId: result.task.assigneeId || undefined,
        assignee: (result.task as any).assignee ? {
          id: (result.task as any).assignee.id,
          name: (result.task as any).assignee.name || "",
          avatar: (result.task as any).assignee.avatar || undefined,
        } : undefined,
      };

      setSections(
        sections.map((s) =>
          s.id === sectionId ? { ...s, tasks: [...s.tasks, newTask] } : s
        )
      );
    } else {
      alert("Failed to add task: " + (result.error || "Unknown error"));
    }

    setNewTaskTitle("");
    setAddingTaskToSection(null);
  };

  const handleCreateClientTask = async (taskData: {
    title: string;
    description?: string;
    taskType: "CLIENT_REQUEST";
    clientRequestType: string;
    uploadDestination?: string;
    attachedFiles?: File[];
  }) => {
    if (!wizardTargetSectionId) return;

    const section = sections.find((s) => s.id === wizardTargetSectionId);
    if (!section) return;

    // Convert files to base64 if present
    let attachments: Array<{
      name: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }> = [];

    if (taskData.attachedFiles && taskData.attachedFiles.length > 0) {
      console.log(" Converting", taskData.attachedFiles.length, "files to base64...");
      
      const filePromises = taskData.attachedFiles.map((file) => {
        return new Promise<{
          name: string;
          fileUrl: string;
          fileSize: number;
          mimeType: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              fileUrl: e.target?.result as string,
              fileSize: file.size,
              mimeType: file.type,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        attachments = await Promise.all(filePromises);
        console.log(" Files converted successfully");
      } catch (error) {
        console.error(" Failed to convert files:", error);
        alert("Failed to process file attachments");
        return;
      }
    }

    const result = await addProjectTask(project.id, {
      title: taskData.title,
      description: taskData.description,
      order: section.tasks.length,
      taskType: "CLIENT_REQUEST",
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (result.success && result.task) {
      const newTask: Task = {
        id: result.task.id,
        title: result.task.title,
        description: result.task.description || undefined,
        status: result.task.status,
        subtasks: [],
        assigneeId: result.task.assigneeId || undefined,
        taskType: "CLIENT_REQUEST",
      };

      setSections(
        sections.map((s) =>
          s.id === wizardTargetSectionId ? { ...s, tasks: [...s.tasks, newTask] } : s
        )
      );
      
      console.log(" Task created with", attachments.length, "attachments");
    } else {
      alert("Failed to add task: " + (result.error || "Unknown error"));
    }

    setWizardTargetSectionId(null);
  };

  const getTaskTypeIcon = (type: string) => {
    return type === "TEAM_TASK" ? (
      <Users className="h-4 w-4 text-blue-600" />
    ) : (
      <UserCircle className="h-4 w-4 text-purple-600" />
    );
  };

  const handleTaskClick = (task: Task, sectionId: string) => {
    // Get the section to determine task type
    const section = sections.find(s => s.id === sectionId);
    const taskWithType = { ...task, taskType: section?.type || "TEAM_TASK" };
    setSelectedTask(taskWithType);
    setSelectedSectionId(sectionId);
    setIsAddingSubtask(false);
    setNewSubtaskTitle("");
  };

  const handleCloseTaskPanel = () => {
    setSelectedTask(null);
    setSelectedSectionId(null);
    setIsAddingSubtask(false);
    setNewSubtaskTitle("");
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !selectedTask || !selectedSectionId) return;

    // Save subtask to database (subtasks are tasks with parentId)
    if (!selectedTask.id.startsWith("temp-")) {
      const result = await addProjectTask(project.id, {
        title: newSubtaskTitle.trim(),
        parentId: selectedTask.id,
        order: selectedTask.subtasks.length,
      });

      if (result.success && result.task) {
        const newSubtask: Subtask = {
          id: result.task.id,
          title: result.task.title,
          isCompleted: false,
        };

        const updatedTask = {
          ...selectedTask,
          subtasks: [...selectedTask.subtasks, newSubtask],
        };

        setSections(
          sections.map((s) =>
            s.id === selectedSectionId
              ? {
                  ...s,
                  tasks: s.tasks.map((t) =>
                    t.id === selectedTask.id ? updatedTask : t
                  ),
                }
              : s
          )
        );

        setSelectedTask(updatedTask);
      } else {
        alert("Failed to add subtask: " + (result.error || "Unknown error"));
      }
    } else {
      // For temp tasks, just add locally
      const newSubtask: Subtask = {
        id: `subtask-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        isCompleted: false,
      };

      const updatedTask = {
        ...selectedTask,
        subtasks: [...selectedTask.subtasks, newSubtask],
      };

      setSections(
        sections.map((s) =>
          s.id === selectedSectionId
            ? {
                ...s,
                tasks: s.tasks.map((t) =>
                  t.id === selectedTask.id ? updatedTask : t
                ),
              }
            : s
        )
      );

      setSelectedTask(updatedTask);
    }

    setNewSubtaskTitle("");
    setIsAddingSubtask(false);
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!selectedTask || !selectedSectionId) return;

    // Delete from database if it's a real subtask
    if (!subtaskId.startsWith("subtask-")) {
      const result = await deleteProjectTask(subtaskId);
      if (!result.success) {
        alert("Failed to delete subtask: " + (result.error || "Unknown error"));
        return;
      }
    }

    const updatedTask = {
      ...selectedTask,
      subtasks: selectedTask.subtasks.filter((st) => st.id !== subtaskId),
    };

    setSections(
      sections.map((s) =>
        s.id === selectedSectionId
          ? {
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === selectedTask.id ? updatedTask : t
              ),
            }
          : s
      )
    );

    setSelectedTask(updatedTask);
  };

  const handleDeleteTask = async (taskId: string, sectionId: string) => {
    // Only delete from database if it's a real task (not temp)
    if (!taskId.startsWith("temp-")) {
      const result = await deleteProjectTask(taskId);
      if (!result.success) {
        alert("Failed to delete task: " + (result.error || "Unknown error"));
        return;
      }
    }

    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }
          : s
      )
    );

    if (selectedTask?.id === taskId) {
      handleCloseTaskPanel();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{project.name}</h1>
                {project.dueDate && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                  </span>
                )}
                <RefreshCw className="h-4 w-4 text-gray-400" />
              </div>
              {/* Progress Bar */}
              {(() => {
                const allTasks = sections.flatMap((s) => s.tasks);
                const completedTasks = allTasks.filter((t) => t.status === "COMPLETED").length;
                const totalTasks = allTasks.length;
                const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                return (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-48 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {totalTasks > 0 && (
                      <span className="text-xs text-gray-500 font-medium">
                        {completedTasks}/{totalTasks}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveProject}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {hasChanges ? "Save Changes" : "Saved"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Project Info Bar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Client:</span>
            <span className="font-medium">{project.client?.legalName || project.client?.preferredName || "No client"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Due:</span>
            <span className="font-medium">
              {project.dueDate
                ? new Date(project.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No due date"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Status:</span>
            <Badge 
              variant="outline" 
              className={`capitalize ${projectStatus === "COMPLETED" ? "bg-green-100 text-green-800 border-green-300" : ""}`}
            >
              {projectStatus?.replace(/_/g, " ").toLowerCase() || "Not started"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Tag:</span>
            <ProjectTagSelector
              projectId={project.id}
              currentTag={projectTag}
              onTagChange={(tag) => setProjectTag(tag)}
              isPartner={userRole === "PARTNER"}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList className="bg-transparent border-0 p-0 h-auto">
            <TabsTrigger
              value="list"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Add Section Buttons */}
      <div className="px-6 py-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddSection("TEAM_TASK")}
          className="text-blue-600 border-blue-600 hover:bg-emerald-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          Team Tasks
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddSection("CLIENT_REQUEST")}
          className="text-purple-600 border-purple-600 hover:bg-purple-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          Client Request
        </Button>
      </div>

      {/* Content Area */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg border min-h-[400px]">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-gray-400 mb-4">
                <List className="h-12 w-12 mx-auto mb-2" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No sections yet
              </h3>
              <p className="text-gray-500 mb-6">
                Add a section to start building your project
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAddSection("TEAM_TASK")}
                  className="text-blue-600 border-blue-600 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Team Tasks
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAddSection("CLIENT_REQUEST")}
                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Client Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {sections.map((section) => (
                <Collapsible
                  key={section.id}
                  open={expandedSections.has(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                        {getTaskTypeIcon(section.type)}
                        <span className="font-medium">{section.name}</span>
                        <span className="text-sm text-gray-500">
                          ({section.tasks.filter(t => t.status === "COMPLETED").length}/{section.tasks.length} completed)
                        </span>
                        {section.tasks.length > 0 && section.tasks.every(t => t.status === "COMPLETED") && (
                          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                            ✓ Complete
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-12 pr-4 pb-4">
                      {section.tasks.length === 0 ? (
                        <p className="text-sm text-gray-500 py-2">
                          No tasks in this section
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {section.tasks.map((task) => (
                            <div key={task.id} className="space-y-1">
                              <div
                                className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 group ${selectedTask?.id === task.id ? "bg-emerald-50 border border-blue-200" : ""}`}
                              >
                                {/* Checkbox for task completion */}
                                <Checkbox
                                  checked={task.status === "COMPLETED"}
                                  onCheckedChange={() => handleToggleTaskComplete(task.id, section.id, task.status)}
                                  className="h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <div 
                                  className="flex items-center gap-2 flex-1 cursor-pointer"
                                  onClick={() => handleTaskClick(task, section.id)}
                                >
                                  {section.type === "TEAM_TASK" ? (
                                    <Users className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <UserCircle className="h-4 w-4 text-orange-500" />
                                  )}
                                  <span className={`text-sm ${task.status === "COMPLETED" ? "line-through text-gray-400" : ""}`}>
                                    {task.title}
                                  </span>
                                  {task.subtasks.length > 0 && (
                                    <span className="text-xs text-gray-400">
                                      ({task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length} subtasks)
                                    </span>
                                  )}
                                  {task.assignee && (
                                    <Avatar className="h-5 w-5 ml-auto">
                                      <AvatarFallback className="text-xs bg-blue-500 text-white">
                                        {getInitials(task.assignee.name, task.assignee.name)}
                                      </AvatarFallback>
                                    </Avatar>
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
                              {task.subtasks.length > 0 && (
                                <div className="ml-10 pl-4 border-l-2 border-gray-200 space-y-1">
                                  {task.subtasks.map((subtask) => (
                                    <div
                                      key={subtask.id}
                                      className="flex items-center gap-2 py-1 px-2 text-sm text-gray-600 hover:bg-gray-50 rounded group"
                                    >
                                      <Checkbox
                                        checked={subtask.isCompleted}
                                        onCheckedChange={() => handleToggleSubtaskComplete(subtask.id, task.id, section.id, subtask.isCompleted)}
                                        className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                      />
                                      <span 
                                        className={`flex-1 cursor-pointer ${subtask.isCompleted ? "line-through text-gray-400" : ""}`}
                                        onClick={() => handleTaskClick(task, section.id)}
                                      >
                                        {subtask.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Task */}
                      {addingTaskToSection === section.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            placeholder="Task title"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddTask(section.id);
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
                            onClick={() => handleAddTask(section.id)}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-gray-500"
                          onClick={() => {
                            if (section.type === "CLIENT_REQUEST") {
                              setWizardTargetSectionId(section.id);
                              setShowClientTaskWizard(true);
                            } else {
                              setAddingTaskToSection(section.id);
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add task
                        </Button>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l shadow-lg z-50 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
            <h3 className="font-semibold">Task Details</h3>
            <Button variant="ghost" size="icon" onClick={handleCloseTaskPanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-6">
            {/* Task Title */}
            <div>
              <h4 className="text-lg font-medium">{selectedTask.title}</h4>
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="w-full min-h-[80px] p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Add a description for this task..."
                value={selectedTask.description || ""}
                onChange={(e) => {
                  if (selectedSectionId) {
                    handleTaskDescriptionChange(selectedTask.id, selectedSectionId, e.target.value);
                  }
                }}
              />
            </div>

            {/* Task Type Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                selectedTask.taskType === "TEAM_TASK"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
              }`}>
                {selectedTask.taskType === "TEAM_TASK" ? "Team Task" : "Client Request"}
              </span>
            </div>

            {/* Assignee Section - Only for TEAM_TASK */}
            {selectedTask.taskType === "TEAM_TASK" && (
              <div className="space-y-3">
                <h5 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assignee
                </h5>
                <Select
                  value={selectedTask.assigneeId || ""}
                  onValueChange={(value) => {
                    if (selectedSectionId) {
                      handleAssigneeChange(selectedTask.id, selectedSectionId, value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assignee">
                      {selectedTask.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {getInitials(selectedTask.assignee.name, selectedTask.assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{selectedTask.assignee.name}</span>
                        </div>
                      ) : (
                        "Select assignee"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {getInitials(member.name, member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name || member.email}</span>
                          <span className="text-xs text-gray-400">({member.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subtasks Section - Only for TEAM_TASK */}
            {selectedTask.taskType === "TEAM_TASK" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Subtasks
                  </h5>
                  <span className="text-sm text-gray-500">
                    {selectedTask.subtasks.length} items
                  </span>
                </div>

                {/* Subtask List */}
                <div className="space-y-2">
                  {selectedTask.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded group"
                    >
                      <Checkbox
                        checked={subtask.isCompleted}
                        onCheckedChange={() => {
                          if (selectedSectionId) {
                            handleToggleSubtaskComplete(subtask.id, selectedTask.id, selectedSectionId, subtask.isCompleted);
                          }
                        }}
                        className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className={`flex-1 text-sm ${subtask.isCompleted ? "line-through text-gray-400" : ""}`}>
                        {subtask.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask */}
                {isAddingSubtask ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Subtask title..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubtask();
                        if (e.key === "Escape") {
                          setIsAddingSubtask(false);
                          setNewSubtaskTitle("");
                        }
                      }}
                      autoFocus
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleAddSubtask}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsAddingSubtask(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subtask
                  </Button>
                )}
              </div>
            )}

            {/* Task Automations Section - Only for TEAM_TASK */}
            {selectedTask.taskType === "TEAM_TASK" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Task Automations
                  </h5>
                </div>
                <p className="text-sm text-gray-500">
                  No automations configured yet.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Automation
                </Button>
              </div>
            )}

            {/* Client Request Section - Only for CLIENT_REQUEST */}
            {selectedTask.taskType === "CLIENT_REQUEST" && (
              <div className="space-y-4">
                {/* Send Notification Button */}
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    const result = await sendClientTaskNotification(selectedTask.id);
                    if (result.success) {
                      alert(result.message || "Notification sent to client!");
                    } else {
                      alert("Failed to send notification: " + (result.error || "Unknown error"));
                    }
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification to Client
                </Button>

                {/* Client's Answer - For ASK_QUESTION tasks */}
                {selectedTask.answer && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-green-700">Client's Answer</h5>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{selectedTask.answer}</p>
                      {selectedTask.answeredAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Answered on {new Date(selectedTask.answeredAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Documents for SEND_DOCUMENT tasks / Client Documents for DOCUMENT_UPLOAD tasks - Not for Q&A */}
                {!(selectedTask.title?.toLowerCase().includes('question') || 
                   selectedTask.title?.toLowerCase().includes('answer') || 
                   selectedTask.title?.toLowerCase().includes('what') ||
                   selectedTask.title?.toLowerCase().includes('how') ||
                   selectedTask.question !== undefined) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm">
                        {selectedTask.title?.toLowerCase().includes('review') || selectedTask.title?.toLowerCase().includes('check') 
                          ? 'Documents for Client' 
                          : 'Documents Uploaded By Client'}
                      </h5>
                    </div>
                    
                    {/* Show team documents for SEND_DOCUMENT tasks */}
                    {(selectedTask.title?.toLowerCase().includes('review') || selectedTask.title?.toLowerCase().includes('check')) ? (
                      <>
                        {teamDocuments.length === 0 && taskAttachments.length === 0 ? (
                          <div className="text-sm text-gray-500 italic">
                            No documents uploaded yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Task Attachments (uploaded during task creation) */}
                            {taskAttachments.map((attachment: any) => (
                              <div key={attachment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3">
                                  <Paperclip className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'Unknown size'} • 
                                      Attached during task creation
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadAttachment(attachment)}
                                  >
                                    <Download className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAttachment(attachment.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Team Documents (uploaded after task creation) */}
                            {teamDocuments.map((doc: any) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3">
                                  <Paperclip className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Unknown size'} • 
                                      Uploaded by {doc.uploadedBy?.name || 'Team'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = doc.fileUrl || '';
                                      link.download = doc.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                  >
                                    <Download className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTeamDocument(doc.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            id="team-doc-upload"
                            className="hidden"
                            onChange={handleTeamDocumentUpload}
                            accept="*/*"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => document.getElementById('team-doc-upload')?.click()}
                            disabled={isUploadingTeamDoc}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploadingTeamDoc ? 'Uploading...' : 'Upload Document for Client'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Show client documents for DOCUMENT_UPLOAD tasks */
                      <>
                        {clientDocuments.length === 0 ? (
                          <div className="text-sm text-gray-500 italic">
                            No documents uploaded yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {clientDocuments.map((doc: any) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <Paperclip className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Unknown size'} • 
                                      {doc.receivedAt ? new Date(doc.receivedAt).toLocaleDateString() : 'Unknown date'}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    const result = await downloadDocument(doc.id);
                                    if (result.success && result.document) {
                                      const link = document.createElement('a');
                                      link.href = result.document.fileUrl || '';
                                      link.download = result.document.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4 text-blue-600" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Attachments Section - Only for TEAM_TASK */}
            {selectedTask.taskType === "TEAM_TASK" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                  </h5>
                </div>
                {taskAttachments.length === 0 ? (
                  <p className="text-sm text-gray-500">No attachments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {taskAttachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{attachment.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            <Download className="h-3 w-3 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleAttachmentUpload}
                  />
                  <Button variant="outline" size="sm" className="w-full pointer-events-none">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Attachment
                  </Button>
                </div>
              </div>
            )}

            {/* Comments/Notes Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </h5>
                <span className="text-sm text-gray-500">{taskComments.length}</span>
              </div>
              
              {/* Comment Input */}
              <div className="flex items-start gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-blue-500 text-white">
                    {getInitials(null, "user")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <textarea
                    className="w-full min-h-[60px] p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Type a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isAddingComment}
                    >
                      {isAddingComment ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Post
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {taskComments.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {taskComments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-gray-200">
                          {getInitials(comment.user.name, comment.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.user.name || comment.user.email}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Task */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (selectedSectionId) {
                    handleDeleteTask(selectedTask.id, selectedSectionId);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Client Task Wizard */}
      <ClientTaskWizard
        open={showClientTaskWizard}
        onOpenChange={setShowClientTaskWizard}
        onCreateTask={handleCreateClientTask}
      />
    </div>
  );
}
