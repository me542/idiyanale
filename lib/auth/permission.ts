// import type { Permissions } from "./jwt";

// export function getStoredPermissions(): Permissions | null {
//   if (typeof window === "undefined") return null;

//   const raw = localStorage.getItem("permissions");
//   if (!raw) return null;

//   try {
//     return JSON.parse(raw) as Permissions;
//   } catch {
//     return null;
//   }
// }

// // Mirrors your BE's RequirePermission(c, func(p) bool { ... })
// export function hasPermission(check: (p: Permissions) => boolean): boolean {
//   const perms = getStoredPermissions();
//   if (!perms) return false;
//   return check(perms);
// }

// export function getStoredInstitutionId(): number | null {
//   if (typeof window === "undefined") return null;

//   const raw = localStorage.getItem("institution_id");
//   if (!raw) return null;

//   const parsed = Number(raw);
//   return Number.isNaN(parsed) ? null : parsed;
// }