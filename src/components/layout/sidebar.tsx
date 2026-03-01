"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  UserCog,
  Calendar,
  Settings,
  LogOut,
  GitBranch,
  DollarSign,
  MessageSquareMore,
  Shield,
  Briefcase,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type UserRole = "PARTNER" | "MANAGER" | "ASSOCIATE";

// Sub-navigation for Clients
const clientSubNav = [
  { name: "Dashboard", href: "/clients" },
  { name: "Documents", href: "/documents" },
  { name: "Client Requests", href: "/client-requests" },
];

// Sub-navigation for Workflows
const workflowSubNav = [
  { name: "Projects", href: "/projects" },
  { name: "Workflows", href: "/workflows" },
  { name: "Timeline", href: "/timeline" },
];

// Navigation items with role-based access
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["PARTNER", "MANAGER", "ASSOCIATE"] },
  { name: "Clients", href: "/clients", icon: Users, roles: ["PARTNER", "MANAGER", "ASSOCIATE"], hasSubNav: "clients" },
  { name: "Work", href: "/projects", icon: FolderKanban, roles: ["PARTNER", "MANAGER", "ASSOCIATE"], hasSubNav: "workflows" },
  { name: "Billing", href: "/billing", icon: DollarSign, roles: ["PARTNER", "MANAGER"] },
  { name: "Team", href: "/team", icon: UserCog, roles: ["PARTNER", "MANAGER"] },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings, roles: ["PARTNER"] },
];

function getRoleIcon(role: string) {
  const icons: Record<string, any> = {
    PARTNER: Shield,
    MANAGER: Briefcase,
    ASSOCIATE: User,
  };
  return icons[role] || User;
}

function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    PARTNER: "bg-indigo-500/90",
    MANAGER: "bg-sky-500/90",
    ASSOCIATE: "bg-emerald-500/90",
  };
  return colors[role] || "bg-slate-500/90";
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [clientsExpanded, setClientsExpanded] = useState(true);
  const [workflowsExpanded, setWorkflowsExpanded] = useState(true);
  
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  const filteredBottomNavigation = bottomNavigation.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const RoleIcon = userRole ? getRoleIcon(userRole) : User;
  
  const isClientsActive = pathname.startsWith("/clients") || pathname.startsWith("/documents") || pathname.startsWith("/client-requests");
  const isWorkflowsActive = pathname.startsWith("/projects") || pathname.startsWith("/tasks") || pathname.startsWith("/workflows") || pathname.startsWith("/timeline");

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">TaskGrid</span>
        </Link>
      </div>

      {/* User Info */}
      {session?.user && (
        <div className="px-4 py-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-slate-700">
              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-medium">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">
                {userName || userEmail}
              </p>
              {userRole && (
                <Badge className={cn("text-xs mt-1 font-medium", getRoleBadgeColor(userRole))}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {userRole}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = item.hasSubNav === "clients" ? isClientsActive : 
                         item.hasSubNav === "workflows" ? isWorkflowsActive : 
                         pathname.startsWith(item.href);
          
          if (item.hasSubNav === "clients") {
            return (
              <div key={item.name}>
                <button
                  onClick={() => { setClientsExpanded(!clientsExpanded); if (!clientsExpanded) setWorkflowsExpanded(false); }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-slate-800/70 text-white"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-5 w-5", isActive && "text-white")} />
                    {item.name}
                  </div>
                  {clientsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {clientsExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {clientSubNav.map((subItem) => {
                      const isSubActive = pathname === subItem.href || 
                        (subItem.href === "/clients" && pathname.startsWith("/clients")) ||
                        (subItem.href === "/documents" && pathname.startsWith("/documents")) ||
                        (subItem.href === "/client-requests" && pathname.startsWith("/client-requests"));
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isSubActive
                              ? "bg-blue-600/90 text-white shadow-lg shadow-blue-600/20"
                              : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                          )}
                        >
                          <span className="w-5" />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          if (item.hasSubNav === "workflows") {
            return (
              <div key={item.name}>
                <button
                  onClick={() => { setWorkflowsExpanded(!workflowsExpanded); if (!workflowsExpanded) setClientsExpanded(false); }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-slate-800/70 text-white"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-5 w-5", isActive && "text-white")} />
                    {item.name}
                  </div>
                  {workflowsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {workflowsExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {workflowSubNav.map((subItem) => {
                      const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href);
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isSubActive
                              ? "bg-blue-600/90 text-white shadow-lg shadow-blue-600/20"
                              : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                          )}
                        >
                          <span className="w-5" />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600/90 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-white")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-slate-800/50 px-3 py-4">
        {filteredBottomNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600/90 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-slate-800/70 hover:text-slate-100"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
