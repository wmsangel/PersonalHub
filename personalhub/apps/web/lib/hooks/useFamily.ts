"use client";

import { useContext } from "react";
import { FamilyContext } from "@/components/providers/FamilyProvider";
export type { ModulePermissionKey } from "@/components/providers/FamilyProvider";

export function useFamily() {
  const context = useContext(FamilyContext);

  if (!context) {
    throw new Error("useFamily must be used inside FamilyProvider");
  }

  return context;
}
