"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Plus,
  Trash2,
  Settings,
  Zap,
  Paperclip,
  CheckSquare,
  Upload,
  ToggleLeft,
  ToggleRight,
  FileText,
  Image,
  File,
} from "lucide-react";
import {
  addTemplateSubtask,
  deleteTemplateSubtask,
  addTemplateAutomation,
  deleteTemplateAutomation,
  updateTemplateTask,
  deleteTemplateTask,
  addTemplateAttachment,
  deleteTemplateAttachment,
} from "@/app/actions/templates";

interface TaskDetailPanelProps {
  task: any;
  onClose: () => void;
  onTaskDeleted: () => void;
  onTaskUpdated: (updates: any) => void;
}

export function TaskDetailPanel({ task, onClose, onTaskDeleted, onTaskUpdated }: TaskDetailPanelProps) {
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [automations, setAutomations] = useState(task.automations || []);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isAddingAutomation, setIsAddingAutomation] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [allowClientUpload, setAllowClientUpload] = useState(task.allowClientUpload || false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when task prop changes (when selecting a different task)
  useEffect(() => {
    setSubtasks(task.subtasks || []);
    setAutomations(task.automations || []);
    setAttachments(task.attachments || []);
    setAllowClientUpload(task.allowClientUpload || false);
    setNewSubtaskTitle("");
    setIsAddingSubtask(false);
    setIsAddingAutomation(false);
    setSelectedAction("");
  }, [task.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      // For now, we'll store file metadata. In production, you'd upload to S3/cloud storage
      const result = await addTemplateAttachment(task.id, {
        name: file.name,
        fileUrl: URL.createObjectURL(file), // Temporary URL - in production use cloud storage
        mimeType: file.type,
        fileSize: file.size,
      });

      if (result.success && result.attachment) {
        const newAttachments = [...attachments, result.attachment];
        setAttachments(newAttachments);
        onTaskUpdated({ attachments: newAttachments });
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const result = await deleteTemplateAttachment(attachmentId);
    if (result.success) {
      const newAttachments = attachments.filter((a: any) => a.id !== attachmentId);
      setAttachments(newAttachments);
      onTaskUpdated({ attachments: newAttachments });
    }
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
    if (type?.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    const maxOrder = subtasks.length > 0
      ? Math.max(...subtasks.map((s: any) => s.order))
      : 0;

    const result = await addTemplateSubtask(task.id, {
      title: newSubtaskTitle.trim(),
      order: maxOrder + 1,
    });

    if (result.success && result.subtask) {
      const newSubtasks = [...subtasks, result.subtask];
      setSubtasks(newSubtasks);
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
      onTaskUpdated({ subtasks: newSubtasks });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const result = await deleteTemplateSubtask(subtaskId);
    if (result.success) {
      const newSubtasks = subtasks.filter((s: any) => s.id !== subtaskId);
      setSubtasks(newSubtasks);
      onTaskUpdated({ subtasks: newSubtasks });
    }
  };

  const handleAddAutomation = async () => {
    if (!selectedAction) return;

    const result = await addTemplateAutomation(task.id, {
      trigger: "TASK_COMPLETED",
      action: selectedAction as any,
    });

    if (result.success && result.automation) {
      const newAutomations = [...automations, result.automation];
      setAutomations(newAutomations);
      setSelectedAction("");
      setIsAddingAutomation(false);
      onTaskUpdated({ automations: newAutomations });
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    const result = await deleteTemplateAutomation(automationId);
    if (result.success) {
      const newAutomations = automations.filter((a: any) => a.id !== automationId);
      setAutomations(newAutomations);
      onTaskUpdated({ automations: newAutomations });
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const result = await deleteTemplateTask(task.id);
    if (result.success) {
      onTaskDeleted();
    }
  };

  const handleToggleClientUpload = async () => {
    const newValue = !allowClientUpload;
    setAllowClientUpload(newValue);
    const result = await updateTemplateTask(task.id, { allowClientUpload: newValue });
    if (result.success) {
      onTaskUpdated({ allowClientUpload: newValue });
    } else {
      // Revert on failure
      setAllowClientUpload(!newValue);
      console.error("Failed to update client upload setting:", result.error);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "CHANGE_PROJECT_TAG":
        return "Change the tag on the project";
      case "SEND_EMAIL_TO_CLIENT":
        return "Send a customized email to the client";
      case "CREATE_PROJECT":
        return "Create project from template";
      default:
        return action;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-xl border-l z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg truncate">{task.title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Task Type Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            task.taskType === "TEAM_TASK"
              ? "bg-blue-100 text-blue-700"
              : "bg-orange-100 text-orange-700"
          }`}>
            {task.taskType === "TEAM_TASK" ? "Team Task" : "Client Request"}
          </span>
        </div>

        {/* Subtasks Section - Only for TEAM_TASK */}
        {task.taskType === "TEAM_TASK" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium">Subtasks</h3>
            </div>

            {subtasks.length === 0 && !isAddingSubtask && (
              <p className="text-sm text-gray-500 mb-2">
                No subtasks. You can create subtasks using the form below.
              </p>
            )}

            <div className="space-y-2">
              {subtasks.map((subtask: any) => (
                <div
                  key={subtask.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group"
                >
                  <span className="text-sm">{subtask.title}</span>
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

            {isAddingSubtask ? (
              <div className="mt-2 flex items-center gap-2">
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
              <button
                className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-emerald-700"
                onClick={() => setIsAddingSubtask(true)}
              >
                <Plus className="h-4 w-4" />
                Add subtask
              </button>
            )}
          </div>
        )}

        {/* Task Automations Section - Only for TEAM_TASK */}
        {task.taskType === "TEAM_TASK" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium">Task Automations</h3>
            </div>

            <p className="text-sm text-gray-500 mb-3">
              When this task is completed automatically:
            </p>

            {automations.length > 0 && (
              <ul className="space-y-2 mb-3">
                {automations.map((automation: any) => (
                  <li
                    key={automation.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{getActionLabel(automation.action)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteAutomation(automation.id)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {isAddingAutomation ? (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm">When this task is completed</span>
                </div>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHANGE_PROJECT_TAG">Change tag on project</SelectItem>
                    <SelectItem value="SEND_EMAIL_TO_CLIENT">Send email to client</SelectItem>
                    <SelectItem value="CREATE_PROJECT">Create project</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddAutomation} disabled={!selectedAction}>
                    Add Automation
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingAutomation(false);
                      setSelectedAction("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-emerald-700"
                onClick={() => setIsAddingAutomation(true)}
              >
                <Plus className="h-4 w-4" />
                Add Task Automation
              </button>
            )}
          </div>
        )}

        {/* Client Upload Option - Only for CLIENT_REQUEST */}
        {task.taskType === "CLIENT_REQUEST" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium">Client Upload</h3>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Allow client to upload files</p>
                <p className="text-xs text-gray-500">Client can attach files to this request</p>
              </div>
              <button
                onClick={handleToggleClientUpload}
                className="focus:outline-none"
              >
                {allowClientUpload ? (
                  <ToggleRight className="h-8 w-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Attachments Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <h3 className="font-medium">Attachments</h3>
          </div>

          {attachments.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-2">
                No attachments found. Use the upload button below to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2 mb-3">
              {attachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(attachment.mimeType)}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block">{attachment.name}</span>
                      {attachment.fileSize && (
                        <span className="text-xs text-gray-400">
                          {formatFileSize(attachment.fileSize)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <button
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-emerald-700 disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>

        {/* Delete Task Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDeleteTask}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Task
          </Button>
        </div>
      </div>
    </div>
  );
}
