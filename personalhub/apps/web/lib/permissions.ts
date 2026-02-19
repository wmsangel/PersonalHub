import type { ModulePermission, ModulePermissionKey } from "@/components/providers/FamilyProvider";

type ModulePermissionsRecord = Partial<Record<ModulePermissionKey, ModulePermission>>;

export const canViewModule = (permissions: ModulePermissionsRecord, module: ModulePermissionKey): boolean =>
  Boolean(permissions[module]?.canView);

export const canEditModule = (permissions: ModulePermissionsRecord, module: ModulePermissionKey): boolean =>
  Boolean(permissions[module]?.canEdit);

export const assertCanViewModule = (permissions: ModulePermissionsRecord, module: ModulePermissionKey): void => {
  if (!canViewModule(permissions, module)) {
    throw new Error(`Access denied: cannot view module "${module}"`);
  }
};

export const assertCanEditModule = (permissions: ModulePermissionsRecord, module: ModulePermissionKey): void => {
  if (!canEditModule(permissions, module)) {
    throw new Error(`Access denied: cannot edit module "${module}"`);
  }
};
