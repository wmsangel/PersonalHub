"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShoppingItem as ShoppingItemType } from "@/hooks/useShoppingList";

type ShoppingItemProps = {
  item: ShoppingItemType;
  onToggle: (itemId: string, nextChecked: boolean) => void;
  onDelete: (itemId: string) => void;
  canEdit?: boolean;
};

export function ShoppingItem({ item, onToggle, onDelete, canEdit = true }: ShoppingItemProps) {
  return (
    <li className={`group flex items-center justify-between gap-3 rounded-lg py-2.5 transition-all duration-150 ${item.is_checked ? "opacity-50" : ""}`}>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={item.is_checked}
          onChange={(event) => onToggle(item.id, event.target.checked)}
          className="h-4 w-4"
          disabled={!canEdit}
        />
        <span className={item.is_checked ? "shopping-strike line-through text-white/40" : "text-white/80"}>
          {item.title}
          {item.quantity ? ` (${item.quantity})` : ""}
        </span>
      </label>

      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        onClick={() => onDelete(item.id)}
        disabled={!canEdit}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
