"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkResetPermissionsAction, updateMemberPermissionAction } from "@/lib/actions/permissions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PermissionRow, type PermissionModule } from "./PermissionRow";

type FamilyRole = "admin" | "adult" | "child" | "guest";
type MemberPermission = {
  module: PermissionModule;
  can_view: boolean;
  can_edit: boolean;
};

type PermissionsDialogProps = {
  memberId: string;
  memberDisplayName: string;
  memberRole: FamilyRole;
  initialPermissions: MemberPermission[];
};

const MODULE_LABELS: Record<PermissionModule, string> = {
  tasks: "Задачи",
  shopping: "Покупки",
  notes: "Заметки",
  calendar: "Календарь",
  finances: "Финансы",
  wishlists: "Вишлисты",
  documents: "Документы",
};

const MODULE_ORDER: PermissionModule[] = ["tasks", "shopping", "notes", "calendar", "finances", "wishlists", "documents"];

export function PermissionsDialog({
  memberId,
  memberDisplayName,
  memberRole,
  initialPermissions,
}: PermissionsDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [permissions, setPermissions] = useState<MemberPermission[]>(initialPermissions);

  const permissionsByModule = useMemo(() => {
    const map = new Map<PermissionModule, MemberPermission>();
    permissions.forEach((permission) => map.set(permission.module, permission));
    return map;
  }, [permissions]);

  const applyOne = async (payload: { module: PermissionModule; can_view: boolean; can_edit: boolean }) => {
    startTransition(async () => {
      const result = await updateMemberPermissionAction(memberId, payload.module, payload);
      if (result.error || !result.data) {
        toast.error(result.error ?? "Не удалось обновить права");
        return;
      }

      setPermissions((prev) =>
        prev.map((item) =>
          item.module === payload.module
            ? { ...item, can_view: result.data?.can_view ?? payload.can_view, can_edit: result.data?.can_edit ?? payload.can_edit }
            : item,
        ),
      );

      toast.success(`Права модуля «${MODULE_LABELS[payload.module]}» обновлены`);
      router.refresh();
    });
  };

  const resetByRole = () => {
    startTransition(async () => {
      const result = await bulkResetPermissionsAction(memberId, memberRole);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Права сброшены по роли (${memberRole})`);
      router.refresh();
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Права
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Права участника</DialogTitle>
          <DialogDescription>
            {memberDisplayName} · роль: <span className="font-medium">{memberRole}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {MODULE_ORDER.map((module) => {
            const current = permissionsByModule.get(module) ?? { module, can_view: false, can_edit: false };
            return (
              <PermissionRow
                key={module}
                module={module}
                label={MODULE_LABELS[module]}
                canView={current.can_view}
                canEdit={current.can_edit}
                disabled={isPending}
                onApply={applyOne}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={resetByRole} disabled={isPending}>
            Сбросить по роли
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
