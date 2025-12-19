import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export type UserRole = "PARTNER" | "MANAGER" | "ASSOCIATE";

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY: UserRole[] = ["ASSOCIATE", "MANAGER", "PARTNER"];

// Permission definitions
export const PERMISSIONS = {
  // Team management
  VIEW_ALL_TEAM: ["PARTNER", "MANAGER"],
  MANAGE_TEAM: ["PARTNER"],
  ADD_TEAM_MEMBER: ["PARTNER"],
  EDIT_TEAM_MEMBER: ["PARTNER", "MANAGER"],
  DEACTIVATE_TEAM_MEMBER: ["PARTNER"],

  // Client management
  VIEW_ALL_CLIENTS: ["PARTNER", "MANAGER"],
  VIEW_ASSIGNED_CLIENTS: ["PARTNER", "MANAGER", "ASSOCIATE"],
  MANAGE_CLIENTS: ["PARTNER", "MANAGER"],
  DELETE_CLIENT: ["PARTNER"],

  // Project management
  VIEW_ALL_PROJECTS: ["PARTNER", "MANAGER"],
  VIEW_ASSIGNED_PROJECTS: ["PARTNER", "MANAGER", "ASSOCIATE"],
  CREATE_PROJECT: ["PARTNER", "MANAGER"],
  EDIT_PROJECT: ["PARTNER", "MANAGER"],
  DELETE_PROJECT: ["PARTNER"],
  ASSIGN_PROJECT: ["PARTNER", "MANAGER"],

  // Task management
  VIEW_ALL_TASKS: ["PARTNER", "MANAGER"],
  VIEW_ASSIGNED_TASKS: ["PARTNER", "MANAGER", "ASSOCIATE"],
  CREATE_TASK: ["PARTNER", "MANAGER"],
  EDIT_ANY_TASK: ["PARTNER", "MANAGER"],
  EDIT_OWN_TASK: ["PARTNER", "MANAGER", "ASSOCIATE"],
  DELETE_TASK: ["PARTNER", "MANAGER"],

  // Billing
  VIEW_BILLING: ["PARTNER", "MANAGER"],
  MANAGE_BILLING: ["PARTNER"],
  CREATE_INVOICE: ["PARTNER", "MANAGER"],
  RECORD_PAYMENT: ["PARTNER"],

  // Time tracking
  VIEW_ALL_TIME: ["PARTNER", "MANAGER"],
  VIEW_OWN_TIME: ["PARTNER", "MANAGER", "ASSOCIATE"],
  MANAGE_TIME: ["PARTNER", "MANAGER", "ASSOCIATE"],

  // Workflows
  VIEW_WORKFLOWS: ["PARTNER", "MANAGER"],
  MANAGE_WORKFLOWS: ["PARTNER", "MANAGER"],

  // Documents
  VIEW_ALL_DOCUMENTS: ["PARTNER", "MANAGER"],
  VIEW_ASSIGNED_DOCUMENTS: ["PARTNER", "MANAGER", "ASSOCIATE"],
  UPLOAD_DOCUMENT: ["PARTNER", "MANAGER", "ASSOCIATE"],
  DELETE_DOCUMENT: ["PARTNER", "MANAGER"],

  // Reports & Dashboard
  VIEW_FULL_DASHBOARD: ["PARTNER", "MANAGER"],
  VIEW_LIMITED_DASHBOARD: ["ASSOCIATE"],
  VIEW_REPORTS: ["PARTNER", "MANAGER"],
  EXPORT_REPORTS: ["PARTNER"],

  // Settings
  MANAGE_SETTINGS: ["PARTNER"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(role);
}

// Check if role1 is higher or equal to role2 in hierarchy
export function isRoleHigherOrEqual(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(role1) >= ROLE_HIERARCHY.indexOf(role2);
}

// Get current user session with role
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

// Require authentication - redirect to login if not authenticated
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

// Require specific permission - redirect if not authorized
export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  if (!hasPermission(user.role as UserRole, permission)) {
    redirect("/unauthorized");
  }
  return user;
}

// Require specific role - redirect if not authorized
export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role as UserRole)) {
    redirect("/unauthorized");
  }
  return user;
}

// Get visible navigation items based on role
export function getNavigationForRole(role: UserRole) {
  const baseNav = [
    { name: "Dashboard", href: "/dashboard", permission: null },
  ];

  const roleBasedNav = [
    { name: "Clients", href: "/clients", permission: "VIEW_ASSIGNED_CLIENTS" as Permission },
    { name: "Projects", href: "/projects", permission: "VIEW_ASSIGNED_PROJECTS" as Permission },
    { name: "Workflows", href: "/workflows", permission: "VIEW_WORKFLOWS" as Permission },
    { name: "Client Requests", href: "/client-requests", permission: "VIEW_ASSIGNED_CLIENTS" as Permission },
    { name: "Documents", href: "/documents", permission: "VIEW_ASSIGNED_DOCUMENTS" as Permission },
    { name: "Billing", href: "/billing", permission: "VIEW_BILLING" as Permission },
    { name: "Team", href: "/team", permission: "VIEW_ALL_TEAM" as Permission },
    { name: "Timeline", href: "/timeline", permission: null },
  ];

  return [
    ...baseNav,
    ...roleBasedNav.filter(
      (item) => item.permission === null || hasPermission(role, item.permission)
    ),
  ];
}

// Filter data based on user role and ownership
export function filterByRole<T extends { assigneeId?: string; createdById?: string }>(
  data: T[],
  userId: string,
  role: UserRole,
  viewAllPermission: Permission
): T[] {
  if (hasPermission(role, viewAllPermission)) {
    return data;
  }
  // Filter to only show items assigned to or created by the user
  return data.filter(
    (item) => item.assigneeId === userId || item.createdById === userId
  );
}
