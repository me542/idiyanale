export interface PermissionState {
  canAudit: boolean;
  [key: string]: boolean;
}

export interface AppRoute {
  path: string;
  title: string;
  clickable: boolean;
  permission?: (p: PermissionState) => boolean;
}

export const ROUTES: AppRoute[] = [
  { path: "/ticket/dashboard", title: "Dashboard", clickable: true },
  { path: "/ticket/all-tickets", title: "All Tickets", clickable: true },
  { path: "/ticket/reports", title: "Reports", clickable: true, permission: (p) => p.canAudit },
  { path: "/minor-task/dashboard", title: "Dashboard", clickable: true },
  { path: "/minor-task/all-tasks", title: "All Tasks", clickable: true },
  { path: "/minor-task/reports", title: "Reports", clickable: true },
  { path: "/chat", title: "Chat", clickable: true },
  { path: "/knowledge", title: "Knowledge", clickable: true },
  { path: "/management/profile", title: "Profile", clickable: true },
  { path: "/management/top", title: "Top", clickable: true },
  { path: "/management/template", title: "Template", clickable: true },
  { path: "/management/user-management", title: "User Management", clickable: true },
  { path: "/management/server-management", title: "Server Management", clickable: true },

  // super-admin
  { path: "/dashboard", title: "Dashboard", clickable: true },
  { path: "/management/institution", title: "Institution Management", clickable: true },
  { path: "/management/user", title: "User Management", clickable: true },
];

export const NON_CLICKABLE_PARENTS = new Set([
  "/ticket",
  "/minor-task",
  "/management",
]);

export function getRoute(path: string) {
  return ROUTES.find((r) => r.path === path);
}

// Staff-protected prefixes — used by middleware.ts
export const PROTECTED_PATHS = [
  "/ticket",
  "/minor-task",
  "/chat",
  "/knowledge",
  "/management",
];

// Super-admin-protected prefixes — used by middleware.ts
export const SUPER_ADMIN_PROTECTED_PATHS = ["/dashboard", "/management"];