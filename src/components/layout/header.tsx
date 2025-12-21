"use client";

import { Bell, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatRole(role: string | undefined) {
  if (!role) return "";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function Header() {
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.email || "User";
  const userRole = (session?.user as any)?.role;

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients, projects, documents..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </Button>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200" />

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500">{formatRole(userRole)}</p>
          </div>
          <Avatar className="h-9 w-9 ring-2 ring-slate-100">
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium text-sm">{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
