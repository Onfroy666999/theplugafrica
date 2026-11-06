"use client";

import { createContext, useContext } from "react";
import { can as allowed, type Permission } from "@/lib/roles";

// The signed-in member's role, for client components that hide what the role can't use (issue #18).
// Hiding is only for clarity: every admin action checks the role again on the server.

const RoleContext = createContext<string>("viewer");

export function AdminRoleProvider({ role, children }: { role: string; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useCan(p: Permission) {
  return allowed(useContext(RoleContext), p);
}
