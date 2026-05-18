import type { UserRole } from "@/types/common";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  receptionist: "Recepción",
  dentist: "Odontólogo",
  assistant: "Auxiliar",
};

export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard": ["admin", "receptionist", "dentist", "assistant"],
  "/patients": ["admin", "receptionist", "dentist", "assistant"],
  "/patients/new": ["admin", "receptionist", "dentist"],
  "/appointments": ["admin", "receptionist", "dentist", "assistant"],
  "/appointments/calendar": ["admin", "receptionist", "dentist", "assistant"],
  "/appointments/new": ["admin", "receptionist"],
  "/clinical-records": ["admin", "dentist"],
  "/treatments": ["admin", "dentist", "assistant"],
  "/billing": ["admin", "receptionist"],
  "/billing/new": ["admin", "receptionist"],
  "/inventory": ["admin", "assistant"],
  "/inventory/new": ["admin", "assistant"],
  "/reports": ["admin", "receptionist", "dentist"],
  "/settings": ["admin"],
  "/profile": ["admin", "receptionist", "dentist", "assistant"],
};

export function getAllowedRolesForPath(pathname: string): UserRole[] | null {
  const exact = ROUTE_ROLES[pathname as keyof typeof ROUTE_ROLES];
  if (exact) return exact;

  if (pathname.startsWith("/patients/")) {
    if (pathname.endsWith("/edit")) return ["admin", "receptionist", "dentist"];
    if (pathname.includes("/new")) return ["admin", "receptionist", "dentist"];
    return ["admin", "receptionist", "dentist", "assistant"];
  }
  if (
    pathname.startsWith("/appointments/") &&
    pathname !== "/appointments/calendar" &&
    pathname !== "/appointments/new"
  ) {
    return ["admin", "receptionist", "dentist", "assistant"];
  }
  if (pathname.startsWith("/clinical-records/")) return ["admin", "dentist"];
  if (pathname.startsWith("/treatments/"))
    return ["admin", "dentist", "assistant"];
  if (pathname.startsWith("/billing/")) return ["admin", "receptionist"];
  if (pathname.startsWith("/inventory/")) return ["admin", "assistant"]; // includes /new and /:id

  return ["admin", "receptionist", "dentist", "assistant"];
}
