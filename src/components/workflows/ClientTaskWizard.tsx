"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Send,
  HelpCircle,
  X,
  Upload,
  FolderOpen,
} from "lucide-react";

interface ClientTaskWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (taskData: {
    title: string;
    description?: string;
    taskType: "CLIENT_REQUEST";
    clientRequestType: string;
    uploadDestination?: string;
    attachedFiles?: File[];
  }) => void;
}

const TASK_OPTIONS = [
  {
    id: "request_documents",
    title: "Securely request documents",
    icon: FileText,
  },
  {
    id: "send_documents",
    title: "Securely send documents",
    icon: Send,
  },
  {
    id: "ask_question",
    title: "Ask a question",
    icon: HelpCircle,
  },
];

export function ClientTaskWizard({
  open,
  onOpenChange,
  onCreateTask,
}: ClientTaskWizardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [uploadDestination, setUploadDestination] = useState<"taskgrid" | "other">("taskgrid");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setTaskTitle("");
    setUploadDestination("taskgrid");
    setAttachedFiles([]);
  };

  const handleBack = () => {
    setSelectedOption(null);
    setTaskTitle("");
    setUploadDestination("taskgrid");
    setAttachedFiles([]);
  };

  const handleCreate = () => {
    if (!taskTitle.trim() || !selectedOption) return;

    onCreateTask({
      title: taskTitle.trim(),
      taskType: "CLIENT_REQUEST",
      clientRequestType: selectedOption,
      uploadDestination: selectedOption === "request_documents" ? uploadDestination : undefined,
      attachedFiles: selectedOption === "send_documents" ? attachedFiles : undefined,
    });

    // Reset state
    setSelectedOption(null);
    setTaskTitle("");
    setUploadDestination("taskgrid");
    setAttachedFiles([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedOption(null);
    setTaskTitle("");
    setUploadDestination("taskgrid");
    setAttachedFiles([]);
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setAttachedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const getOptionTitle = () => {
    const option = TASK_OPTIONS.find(o => o.id === selectedOption);
    return option?.title || "Client Task Wizard";
  };

  const renderForm = () => {
    switch (selectedOption) {
      case "request_documents":
        return (
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tell your client what you are requesting
              </label>
              <Input
                placeholder="Example: Please upload your bank statements"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="border-blue-300 focus:border-emerald-500 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Where do you want these documents to be uploaded?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUploadDestination("taskgrid")}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                    uploadDestination === "taskgrid"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    uploadDestination === "taskgrid" ? "bg-emerald-100" : "bg-gray-100"
                  }`}>
                    <FileText className={`h-5 w-5 ${
                      uploadDestination === "taskgrid" ? "text-blue-600" : "text-gray-500"
                    }`} />
                  </div>
                  <span className="text-sm font-medium">To TaskGrid (default)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadDestination("other")}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                    uploadDestination === "other"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    uploadDestination === "other" ? "bg-emerald-100" : "bg-gray-100"
                  }`}>
                    <FolderOpen className={`h-5 w-5 ${
                      uploadDestination === "other" ? "text-blue-600" : "text-gray-500"
                    }`} />
                  </div>
                  <span className="text-sm font-medium">To another document system</span>
                </button>
              </div>
            </div>
          </div>
        );

      case "send_documents":
        return (
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tell your client what you are sending them
              </label>
              <Input
                placeholder="Example: Please download and review this statement"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="border-blue-300 focus:border-emerald-500 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Upload the documents you want to send
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-700">Drag and drop file</p>
                    <p className="text-sm text-gray-500">or use the browse button</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-emerald-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
                {attachedFiles.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm text-gray-600 mb-2">Selected files:</p>
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="text-sm text-blue-600">
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "ask_question":
        return (
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                What question do you have for your client?
              </label>
              <Input
                placeholder="Example: Are your sales entered for the month?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="border-blue-300 focus:border-emerald-500 focus:ring-emerald-500"
                autoFocus
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {selectedOption ? getOptionTitle() : "Client Task Wizard"}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {!selectedOption ? (
          // Task Type Selection
          <div className="py-2">
            {TASK_OPTIONS.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelect(option.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <option.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">{option.title}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-600 hover:bg-emerald-50"
                >
                  Select
                </Button>
              </div>
            ))}
          </div>
        ) : (
          renderForm()
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={selectedOption ? handleBack : handleClose}>
            {selectedOption ? "Back" : "Close"}
          </Button>
          {selectedOption && (
            <Button
              onClick={handleCreate}
              disabled={!taskTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Client Task
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
