"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FolderOpen,
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calendar,
  Loader2,
} from "lucide-react";
import { getClientDashboardData } from "@/app/actions/client-portal";

interface Project {
  id: string;
  name: string;
  status: string;
  dueDate: Date | null;
  progress: number;
}

interface ClientRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  dueDate: Date | null;
  projectName: string | null;
}

interface ClientTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  projectName: string | null;
  notificationSentAt: Date | null;
}

interface DashboardData {
  clientName: string;
  projects: Project[];
  requests: ClientRequest[];
  tasks: ClientTask[];
  stats: {
    activeProjects: number;
    pendingRequests: number;
    completedProjects: number;
    pendingTasks: number;
  };
}

export default function ClientDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    
    if (status === "loading") {
      return; // Wait for session to load
    }
    
    if (status === "unauthenticated") {
      router.push("/client-login");
      return;
    }
    
    if (status === "authenticated") {
      const userType = (session?.user as any)?.userType;
      
      // Only redirect to team dashboard if explicitly a team member
      if (userType && userType !== "client") {
        router.push("/dashboard");
        return;
      }
      
      loadDashboardData();
    }
  }, [status, session, router]);

  const loadDashboardData = async () => {
    try {
      const clientId = (session?.user as any)?.clientId;
      if (!clientId) return;

      const result = await getClientDashboardData(clientId);
      if (result.success && result.data) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NOT_STARTED: "bg-gray-100 text-gray-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      WAITING_FOR_CLIENT: "bg-yellow-100 text-yellow-700",
      IN_REVIEW: "bg-purple-100 text-purple-700",
      COMPLETED: "bg-green-100 text-green-700",
      PENDING: "bg-orange-100 text-orange-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {dashboardData.clientName}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your projects and pending requests.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.stats.activeProjects}
                </p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData.stats.pendingRequests}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Tasks</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.stats.pendingTasks}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks Section */}
      {dashboardData.tasks.length > 0 && (
        <Card className="mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">My Tasks</h3>
              <Link href="/client-tasks" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {dashboardData.tasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">{task.description}</p>
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
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ongoing Projects */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Ongoing Projects</h3>
              <Link href="/client-tasks" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {dashboardData.projects.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No active projects</p>
              </div>
            ) : (
              dashboardData.projects.slice(0, 3).map((project) => (
                <div key={project.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Due: {formatDate(project.dueDate)}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Pending Requests */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
              <Link href="/client-tasks" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {dashboardData.requests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-300" />
                <p>All caught up! No pending requests.</p>
              </div>
            ) : (
              dashboardData.requests.slice(0, 3).map((request) => (
                <div key={request.id} className="p-4 hover:bg-gray-50 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {request.type === "DOCUMENT_UPLOAD" ? (
                          <Upload className="h-4 w-4 text-orange-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-500" />
                        )}
                        <h4 className="font-medium text-gray-900">{request.title}</h4>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {request.projectName && `${request.projectName}`}
                      </p>
                      {request.dueDate && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Due: {formatDate(request.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
