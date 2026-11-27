export const ALL_USER_ROLES = ["user", "customer", "manager", "admin"] as const;
export type UserRole = (typeof ALL_USER_ROLES)[number];

export const ASSIGNABLE_USER_ROLES = ["user", "manager", "admin"] as const;
export type AssignableUserRole = (typeof ASSIGNABLE_USER_ROLES)[number];

export const ADMIN_ONLY_DASHBOARD_PREFIXES = [
  "/admin/users",
  "/admin/settings",
  "/admin/marketing",
] as const;

export function isAdminRole(role?: string | null): boolean {
  return role === "admin";
}

export function isManagerRole(role?: string | null): boolean {
  return role === "manager";
}

export function isStaffRole(role?: string | null): boolean {
  return role === "admin" || role === "manager";
}

export function isRegularUserRole(role?: string | null): boolean {
  return !isStaffRole(role);
}

export function isAdminOnlyDashboardPath(pathname: string): boolean {
  return ADMIN_ONLY_DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getRoleLabel(role?: string | null): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "manager":
      return "Manager";
    case "user":
    case "customer":
    default:
      return "User";
  }
}

/**
 * Pure permission check for role/user management mutations.
 * - Only `admin` may modify user roles, status, or delete accounts.
 * - `manager` cannot manage user accounts or assign/revoke roles.
 * - An `admin` cannot demote, block, or delete their own account.
 */
export function canManageUserAccount(params: {
  actorRole?: string | null;
  actorId?: string | null;
  targetId?: string | null;
  nextRole?: string;
  nextStatus?: string;
  isDelete?: boolean;
}): { allowed: boolean; reason?: string } {
  if (!isAdminRole(params.actorRole)) {
    return { allowed: false, reason: "Admin access required" };
  }

  const isSelf =
    Boolean(params.actorId) &&
    Boolean(params.targetId) &&
    params.actorId === params.targetId;

  if (isSelf && params.isDelete) {
    return { allowed: false, reason: "You cannot delete your own account" };
  }

  if (isSelf && params.nextRole && params.nextRole !== "admin") {
    return {
      allowed: false,
      reason: "You cannot demote your own admin account",
    };
  }

  if (isSelf && params.nextStatus === "blocked") {
    return { allowed: false, reason: "You cannot block your own account" };
  }

  return { allowed: true };
}
