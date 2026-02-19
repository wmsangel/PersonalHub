"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export type PermissionModule = "calendar" | "tasks" | "notes" | "finances" | "wishlists" | "shopping" | "documents";

type PermissionRowProps = {
  module: PermissionModule;
  label: string;
  canView: boolean;
  canEdit: boolean;
  disabled?: boolean;
  onApply: (payload: { module: PermissionModule; can_view: boolean; can_edit: boolean }) => Promise<void>;
};

export function PermissionRow({ module, label, canView, canEdit, disabled = false, onApply }: PermissionRowProps) {
  const [nextView, setNextView] = useState(canView);
  const [nextEdit, setNextEdit] = useState(canEdit);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = useMemo(() => nextView !== canView || nextEdit !== canEdit, [canEdit, canView, nextEdit, nextView]);

  const apply = async () => {
    setIsSaving(true);
    try {
      await onApply({
        module,
        can_view: nextView,
        can_edit: nextView ? nextEdit : false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-md border p-3">
      <span className="text-sm font-medium">{label}</span>

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={nextView}
          disabled={disabled || isSaving}
          onChange={(event) => {
            const checked = event.target.checked;
            setNextView(checked);
            if (!checked) {
              setNextEdit(false);
            }
          }}
        />
        View
      </label>

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={nextEdit}
          disabled={disabled || isSaving || !nextView}
          onChange={(event) => setNextEdit(event.target.checked)}
        />
        Edit
      </label>

      <Button size="sm" variant="secondary" disabled={disabled || isSaving || !isDirty} onClick={apply}>
        Apply
      </Button>
    </div>
  );
}
