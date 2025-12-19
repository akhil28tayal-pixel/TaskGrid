export const dynamic = "force-dynamic";

import {
  Users,
  FolderKanban,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  DollarSign,
  MessageSquareMore,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getDashboardStats,
  getRecentProjects,
  getPendingDocuments,
  getUpcomingDeadlines,
} from "@/app/actions/dashboard";
import { getPendingClients } from "@/app/actions/clients";
import { PendingClientApprovals } from "@/components/dashboard/PendingClientApprovals";

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NOT_STARTED: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    WAITING_FOR_CLIENT: "bg-yellow-100 text-yellow-800",
    IN_REVIEW: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default async function DashboardPage() {
  const [dashboardStats, recentProjects, pendingDocuments, upcomingDeadlines, pendingClients] = await Promise.all([
    getDashboardStats(),
    getRecentProjects(),
    getPendingDocuments(),
    getUpcomingDeadlines(),
    getPendingClients(),
  ]);

  const stats = [
    { name: "Active Clients", value: dashboardStats.activeClients.toString(), icon: Users },
    { name: "Active Projects", value: dashboardStats.activeProjects.toString(), icon: FolderKanban },
    { name: "Client Requests", value: (dashboardStats.pendingRequests || 0).toString(), icon: MessageSquareMore },
    { name: "Due This Week", value: dashboardStats.dueThisWeek.toString(), icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Pending Client Approvals - Only visible to Partners */}
      <PendingClientApprovals pendingClients={pendingClients} />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {formatStatus(project.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{project.client}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={project.progress} className="h-2 w-32" />
                        <span className="text-xs text-gray-500">{project.progress}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Due</p>
                      <p className="font-medium">{project.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pending Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingDocuments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No pending documents</p>
              ) : (
                <div className="space-y-3">
                  {pendingDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg bg-orange-50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {doc.client.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.client}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {doc.daysOverdue}d overdue
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{deadline.name}</p>
                        <p className="text-xs text-gray-500">{deadline.client}</p>
                      </div>
                      <p className="text-sm font-medium text-blue-600">{deadline.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
