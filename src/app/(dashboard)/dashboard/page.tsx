export const dynamic = "force-dynamic";

import Link from "next/link";
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
    { name: "Active Clients", value: dashboardStats.activeClients.toString(), icon: Users, href: "/clients" },
    { name: "Active Projects", value: dashboardStats.activeProjects.toString(), icon: FolderKanban, href: "/projects" },
    { name: "Client Requests", value: (dashboardStats.pendingRequests || 0).toString(), icon: MessageSquareMore, href: "/client-requests" },
    { name: "Due This Week", value: dashboardStats.dueThisWeek.toString(), icon: Clock, href: "/projects" },
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
          <Link key={stat.name} href={stat.href}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200">
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
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <Link href="/projects" className="lg:col-span-2">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200 h-[380px] flex flex-col">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {recentProjects.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No projects yet</p>
              ) : (
                <div className="space-y-4">
                  {recentProjects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 transition-colors"
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
        </Link>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Pending Documents */}
          <Link href="/documents" className="flex-1">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200 h-[180px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Pending Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                {pendingDocuments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No pending documents</p>
                ) : (
                  <div className="space-y-3">
                    {pendingDocuments.slice(0, 5).map((doc) => (
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
          </Link>

          {/* Upcoming Deadlines */}
          <Link href="/projects" className="flex-1">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200 h-[180px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming deadlines</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.slice(0, 5).map((deadline) => (
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
          </Link>
        </div>
      </div>
    </div>
  );
}
