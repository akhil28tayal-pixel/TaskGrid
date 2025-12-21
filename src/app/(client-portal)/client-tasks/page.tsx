"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload,
  Calendar,
  Loader2
} from "lucide-react";
import { getClientTasks } from "@/app/actions/client-portal";
import { FileUploadModal } from "@/components/client-portal/FileUploadModal";
import { ClientTaskDetail } from "@/components/client-portal/ClientTaskDetail";
import { getTaskComments } from "@/app/actions/tasks";
import { MessageSquare } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  type: string;
  projectName: string | null;
  notificationSentAt?: string | null;
  source?: "client_request" | "project_task";
  commentCount?: number;
  question?: string | null;
  answer?: string | null;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    case "PENDING":
      return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "IN_PROGRESS":
      return <Clock className="w-5 h-5 text-blue-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
  }
}

export default function ClientTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailViewTask, setDetailViewTask] = useState<Task | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/client-login");
      return;
    }

    if (status === "authenticated" && (session?.user as any)?.clientId) {
      fetchTasks();
    }
  }, [status, session, router]);

  const fetchTasks = async () => {
    const clientId = (session?.user as any)?.clientId;
    if (!clientId) return;

    const result = await getClientTasks(clientId);
    if (result.success && result.tasks) {
      // Fetch comment counts for each task
      const tasksWithComments = await Promise.all(
        result.tasks.map(async (task) => {
          const commentsResult = await getTaskComments(task.id);
          return {
            ...task,
            commentCount: commentsResult.success ? commentsResult.comments?.length || 0 : 0,
          };
        })
      );
      setTasks(tasksWithComments);
    }
    setIsLoading(false);
  };

  const handleUploadClick = (task: Task) => {
    setSelectedTask(task);
    setUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    fetchTasks(); // Refresh tasks after upload
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === "PENDING");
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 mt-1">View and manage your pending tasks and requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingTasks.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tasks assigned to you yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setDetailViewTask(task)}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(task.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {task.projectName && (
                          <span className="text-xs text-gray-400">
                            Project: {task.projectName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.commentCount !== undefined && task.commentCount > 0 && (
                          <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                            <MessageSquare className="w-3 h-3" />
                            {task.commentCount} {task.commentCount === 1 ? 'comment' : 'comments'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(task.status)}
                    {task.type === "DOCUMENT_UPLOAD" && task.status !== "COMPLETED" && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadClick(task);
                        }}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Detail View */}
      {detailViewTask && (
        <ClientTaskDetail
          task={detailViewTask}
          onClose={() => setDetailViewTask(null)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* File Upload Modal */}
      {selectedTask && (
        <FileUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
