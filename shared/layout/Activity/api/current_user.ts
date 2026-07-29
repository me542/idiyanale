import { getUserById, type User } from "./get_user"; // adjust to actual path
import { getSuperAdminById, type SuperAdmin } from "./get_super_admin"; // adjust to actual path

export type CurrentUser =
  | { kind: "staff"; data: User }
  | { kind: "super-admin"; data: SuperAdmin };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (typeof window === "undefined") return null;

  const role = localStorage.getItem("role");
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  let stored: { id?: number };
  try {
    stored = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!stored.id) return null;

  if (role === "Super-Admin") {
    const res = await getSuperAdminById(stored.id);
    return { kind: "super-admin", data: res.response };
  }

  const data = await getUserById(stored.id);
  return { kind: "staff", data };
}