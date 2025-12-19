import { Suspense } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Mail,
  Phone,
  MoreHorizontal,
  UserCog,
  Users,
  ChevronRight,
  Shield,
  Briefcase,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTeamMembers, getTeamHierarchy } from "@/app/actions/team";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";

function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    PARTNER: "bg-purple-100 text-purple-800",
    MANAGER: "bg-blue-100 text-blue-800",
    ASSOCIATE: "bg-green-100 text-green-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
}

function getRoleIcon(role: string) {
  const icons: Record<string, any> = {
    PARTNER: Shield,
    MANAGER: Briefcase,
    ASSOCIATE: User,
  };
  return icons[role] || User;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

async function TeamMembersList() {
  const members = await getTeamMembers();

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No team members</h3>
        <p className="mt-2 text-sm text-gray-500">
          Add your first team member to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member: any) => {
        const RoleIcon = getRoleIcon(member.role);
        return (
          <Card key={member.id} className={!member.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} alt={member.name || ""} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {member.name || member.email}
                      {!member.isActive && (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleColor(member.role)}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <UserCog className="mr-2 h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>Reset Password</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {member.isActive ? (
                      <DropdownMenuItem className="text-red-600">
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem className="text-green-600">
                        Reactivate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>

              {member.manager && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">Reports to</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.manager.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.manager.name || member.manager.email}</span>
                  </div>
                </div>
              )}

              {member.subordinates && member.subordinates.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">
                    Team ({member.subordinates.length})
                  </p>
                  <div className="flex -space-x-2">
                    {member.subordinates.slice(0, 5).map((sub: any) => (
                      <Avatar key={sub.id} className="h-6 w-6 border-2 border-white">
                        <AvatarFallback className="text-xs">
                          {getInitials(sub.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {member.subordinates.length > 5 && (
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs border-2 border-white">
                        +{member.subordinates.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{member._count?.assignments || 0}</p>
                  <p className="text-xs text-gray-500">Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{member._count?.tasks || 0}</p>
                  <p className="text-xs text-gray-500">Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function TeamHierarchyView() {
  const hierarchy = await getTeamHierarchy();

  if (hierarchy.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No team hierarchy</h3>
        <p className="mt-2 text-sm text-gray-500">
          Add a Partner to start building your team hierarchy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hierarchy.map((partner: any) => (
        <Card key={partner.id}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={partner.avatar} />
                <AvatarFallback>{getInitials(partner.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{partner.name || partner.email}</h3>
                <Badge className={getRoleColor("PARTNER")}>
                  <Shield className="h-3 w-3 mr-1" />
                  Partner
                </Badge>
              </div>
            </div>

            {partner.subordinates && partner.subordinates.length > 0 && (
              <div className="ml-8 border-l-2 border-gray-200 pl-6 space-y-4">
                {partner.subordinates.map((manager: any) => (
                  <div key={manager.id}>
                    <div className="flex items-center gap-3 mb-2">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={manager.avatar} />
                        <AvatarFallback>{getInitials(manager.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{manager.name || manager.email}</p>
                        <Badge className={getRoleColor(manager.role)} variant="outline">
                          {manager.role}
                        </Badge>
                      </div>
                    </div>

                    {manager.subordinates && manager.subordinates.length > 0 && (
                      <div className="ml-12 border-l-2 border-gray-100 pl-4 space-y-2">
                        {manager.subordinates.map((associate: any) => (
                          <div key={associate.id} className="flex items-center gap-3">
                            <ChevronRight className="h-3 w-3 text-gray-300" />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={associate.avatar} />
                              <AvatarFallback className="text-xs">
                                {getInitials(associate.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm">{associate.name || associate.email}</p>
                              <Badge className={`${getRoleColor("ASSOCIATE")} text-xs`} variant="outline">
                                Associate
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500">Manage your team members and hierarchy</p>
        </div>
        <AddTeamMemberDialog />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            All Members
          </TabsTrigger>
          <TabsTrigger value="hierarchy">
            <UserCog className="mr-2 h-4 w-4" />
            Hierarchy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Suspense fallback={<div className="text-center py-8">Loading team members...</div>}>
            <TeamMembersList />
          </Suspense>
        </TabsContent>

        <TabsContent value="hierarchy">
          <Suspense fallback={<div className="text-center py-8">Loading hierarchy...</div>}>
            <TeamHierarchyView />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
