"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type UserRole = "PARTNER" | "MANAGER" | "ASSOCIATE";

// Navigation items with role-based access
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["PARTNER", "MANAGER", "ASSOCIATE"] },
  { name: "Clients", href: "/clients", icon: Users, roles: ["PARTNER", "MANAGER", "ASSOCIATE"] },
  { name: "Projects", href: "/projects", icon: FolderKanban, roles: ["PARTNER", "MANAGER", "ASSOCIATE"] },
  { name: "Workflows", href: "/workflows", icon: GitBranch, roles: ["PARTNER", "MANAGER"] },
  { name: "Client Requests", href: "/client-requests", icon: MessageSquareMore, roles: ["PARTNER", "MANAGER", "ASSOCIATE"] },
  { name: "Documents", href: "/documents", icon: FileText, roles: ["PARTNER", "MANAGER", "ASSOCIATE"] },
  { name: "Billing", href: "/billing", icon: DollarSign, roles: ["PARTNER", "MANAGER"] },
  { name: "Team", href: "/team", icon: UserCog, roles: ["PARTNER", "MANAGER"] },
  { name: "Timeline", href: "/timeline", icon: Calendar, roles: ["PARTNER", "MANAGER", "ASSOCIATE"] },
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
    PARTNER: "bg-purple-600",
    MANAGER: "bg-blue-600",
    ASSOCIATE: "bg-green-600",
  };
  return colors[role] || "bg-gray-600";
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
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

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <span className="text-xl font-bold text-white">TaskGrid</span>
        </Link>
      </div>

      {/* User Info */}
      {session?.user && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gray-700 text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userName || userEmail}
              </p>
              {userRole && (
                <Badge className={cn("text-xs mt-1", getRoleBadgeColor(userRole))}>
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
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-800 px-3 py-4">
        {filteredBottomNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
