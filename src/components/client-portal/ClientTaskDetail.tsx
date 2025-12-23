"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  X, 
  Calendar, 
  MessageSquare,
  Upload,
  FileText,
  Download,
  Loader2
} from "lucide-react";
import { getTaskComments, getTaskAttachments } from "@/app/actions/tasks";
import { getTaskDocuments } from "@/app/actions/client-file-upload";
import { getTeamDocumentsForTask, submitTaskAnswer } from "@/app/actions/team-document-upload";
import { FileUploadModal } from "./FileUploadModal";
import { Textarea } from "@/components/ui/textarea";

interface ClientTaskDetailProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    dueDate: string | null;
    type: string;
    projectName: string | null;
    question?: string | null;
    answer?: string | null;
  };
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function ClientTaskDetail({ task, onClose, onUploadSuccess }: ClientTaskDetailProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [teamDocuments, setTeamDocuments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  useEffect(() => {
    fetchTaskData();
  }, [task.id]);

  const fetchTaskData = async () => {
    setIsLoading(true);
    const [commentsResult, documentsResult, teamDocsResult, attachmentsResult] = await Promise.all([
      getTaskComments(task.id),
      task.type === "DOCUMENT_UPLOAD" ? getTaskDocuments(task.id) : Promise.resolve({ success: true, documents: [] }),
      task.type === "SEND_DOCUMENT" ? getTeamDocumentsForTask(task.id) : Promise.resolve({ success: true, documents: [] }),
      task.type === "SEND_DOCUMENT" ? getTaskAttachments(task.id) : Promise.resolve({ success: true, attachments: [] }),
    ]);

    if (commentsResult.success) {
      setComments(commentsResult.comments || []);
    }
    if (documentsResult.success) {
      setDocuments(documentsResult.documents || []);
    }
    if (teamDocsResult.success) {
      setTeamDocuments(teamDocsResult.documents || []);
    }
    if (attachmentsResult.success) {
      setAttachments(attachmentsResult.attachments || []);
    }
    setIsLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    
    setIsSubmittingAnswer(true);
    const result = await submitTaskAnswer(task.id, answer.trim());
    if (result.success) {
      task.answer = answer.trim();
      setAnswer("");
      await onUploadSuccess(); // Refresh parent
      onClose(); // Close modal after successful submission
    }
    setIsSubmittingAnswer(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      TODO: { label: "To Do", className: "bg-gray-100 text-gray-700" },
      IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
      IN_REVIEW: { label: "In Review", className: "bg-yellow-100 text-yellow-700" },
      COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
      PENDING: { label: "Pending", className: "bg-orange-100 text-orange-700" },
    };

    const config = statusConfig[status] || statusConfig.TODO;
    return (
      <Badge className={config.className} variant="secondary">
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{task.title}</CardTitle>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {task.projectName && (
                  <span>Project: {task.projectName}</span>
                )}
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due: {formatDate(task.dueDate)}
                  </span>
                )}
                {getStatusBadge(task.status)}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600 text-sm">{task.description}</p>
            </div>
          )}

          {/* Upload Section for DOCUMENT_UPLOAD tasks */}
          {task.type === "DOCUMENT_UPLOAD" && task.status !== "COMPLETED" && (
            <div>
              <h3 className="font-medium mb-3">Upload Documents</h3>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
          )}

          {/* Uploaded Documents - Show for DOCUMENT_UPLOAD tasks */}
          {task.type === "DOCUMENT_UPLOAD" && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Your Uploaded Documents ({documents.length})
              </h3>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Unknown size'} • 
                            {doc.receivedAt ? formatDate(doc.receivedAt) : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-blue-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Documents - Show for SEND_DOCUMENT tasks */}
          {task.type === "SEND_DOCUMENT" && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents from Team ({teamDocuments.length + attachments.length})
              </h3>
              {teamDocuments.length === 0 && attachments.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4">No documents available yet. Your team will upload documents for you to review.</p>
              ) : (
                <div className="space-y-2">
                  {/* Task Attachments (added during task creation) */}
                  {attachments.map((attachment: any) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{attachment.name}</p>
                          <p className="text-xs text-gray-500">
                            {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'Unknown size'} • 
                            Attached by team
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = attachment.fileUrl || '';
                          link.download = attachment.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="w-4 h-4 text-blue-600" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Team Documents (uploaded after task creation) */}
                  {teamDocuments.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Unknown size'} • 
                            Uploaded by {doc.uploadedBy?.name || 'Team'}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                          )}
                        </div>
                      </div>
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
                        <Download className="w-4 h-4 text-blue-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Q&A Section - Show question and answer form */}
          {task.type === "ASK_QUESTION" && (
            <div>
              {(task.question || task.description) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">{task.question || task.description}</p>
                </div>
              )}
              
              {task.answer ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Your Answer (Submitted)</h4>
                  <p className="text-sm text-gray-700">{task.answer}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Your Answer</label>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    className="w-full"
                  />
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim() || isSubmittingAnswer}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmittingAnswer ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Answer"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Comments Section */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {comment.user?.name ? getInitials(comment.user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.user?.name || 'Team Member'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Upload Modal */}
      {uploadModalOpen && (
        <FileUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          taskId={task.id}
          taskTitle={task.title}
          onUploadSuccess={() => {
            fetchTaskData();
            onUploadSuccess();
          }}
        />
      )}
    </div>
  );
}
