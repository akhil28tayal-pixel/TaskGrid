"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FolderOpen,
  Calendar,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { getClientDashboardData } from "@/app/actions/client-portal";

interface Project {
  id: string;
  name: string;
  status: string;
  dueDate: Date | null;
  progress: number;
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    NOT_STARTED: { label: "Not Started", className: "bg-gray-100 text-gray-800" },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
    WAITING_FOR_CLIENT: { label: "Waiting for You", className: "bg-yellow-100 text-yellow-800" },
    IN_REVIEW: { label: "In Review", className: "bg-purple-100 text-purple-800" },
    COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
  };
  
  const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return <Badge className={config.className}>{config.label}</Badge>;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "IN_PROGRESS":
      return <Clock className="w-5 h-5 text-blue-500" />;
    case "WAITING_FOR_CLIENT":
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    default:
      return <FolderOpen className="w-5 h-5 text-gray-400" />;
  }
}

export default function ClientProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/client-login");
      return;
    }

    if (status === "authenticated" && (session?.user as any)?.clientId) {
      fetchProjects();
    }
  }, [status, session, router]);

  const fetchProjects = async () => {
    const clientId = (session?.user as any)?.clientId;
    if (!clientId) return;

    const result = await getClientDashboardData(clientId);
    if (result.success && result.data) {
      setProjects(result.data.projects);
    }
    setIsLoading(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status !== "COMPLETED");
  const completedProjects = projects.filter(p => p.status === "COMPLETED");

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
        <p className="text-gray-500 mt-1">View all projects assigned to you</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-2xl font-bold text-blue-600">{activeProjects.length}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedProjects.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No projects assigned to you yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(project.status)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        {project.dueDate && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {formatDate(project.dueDate)}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          Progress: {project.progress}%
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(project.status)}
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
