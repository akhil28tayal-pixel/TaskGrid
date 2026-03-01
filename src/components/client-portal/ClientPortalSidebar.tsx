"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  CreditCard, 
  LogOut,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";

const navItems = [
  {
    title: "Dashboard",
    href: "/client-dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    href: "/client-projects",
    icon: CheckSquare,
  },
  {
    title: "Documents",
    href: "/client-documents",
    icon: FileText,
  },
  {
    title: "Billing",
    href: "/client-billing",
    icon: CreditCard,
  },
];

export function ClientPortalSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't show sidebar on login page
  if (pathname === "/client-login" || pathname === "/client-setup-password") {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/client-login" });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-gray-900">Client Portal</span>
        </div>
        <NotificationBell />
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-900">
          {session?.user?.name || "Client"}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {session?.user?.email}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-blue-600" : "text-gray-400"
              )} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
