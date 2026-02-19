"use client";

import { createContext, useMemo } from "react";

export type FamilyMemberContextItem = {
  id: string;
  userId: string;
  role: "admin" | "adult" | "child" | "guest";
  nickname: string | null;
  color: string | null;
  fullName: string | null;
  isActive: boolean;
};

export type ModulePermissionKey =
  | "tasks"
  | "shopping"
  | "notes"
  | "calendar"
  | "finances"
  | "wishlists"
  | "documents";

export type ModulePermission = {
  canView: boolean;
  canEdit: boolean;
};

export type FamilyContextValue = {
  familyId: string | null;
  familyName: string | null;
  members: FamilyMemberContextItem[];
  currentMember: FamilyMemberContextItem | null;
  isAdmin: boolean;
  modulePermissions: Record<ModulePermissionKey, ModulePermission>;
};

export const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({
  initialValue,
  children,
}: Readonly<{
  initialValue: FamilyContextValue;
  children: React.ReactNode;
}>) {
  const value = useMemo(() => initialValue, [initialValue]);

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}
