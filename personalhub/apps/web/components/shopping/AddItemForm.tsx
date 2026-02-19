"use client";

import { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AddItemFormProps = {
  onAdd: (payload: { title: string; quantity?: string; category?: string }) => Promise<void>;
  isPending: boolean;
  canEdit?: boolean;
};

export function AddItemForm({ onAdd, isPending, canEdit = true }: AddItemFormProps) {
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canEdit) {
          return;
        }

        const cleanTitle = title.trim();
        if (!cleanTitle) {
          return;
        }

        await onAdd({
          title: cleanTitle,
          quantity: quantity.trim() || undefined,
          category: category.trim() || undefined,
        });

        setTitle("");
        setQuantity("");
        setCategory("");
      }}
    >
      <div
        className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all duration-150
                   focus-within:border-indigo-500/30 focus-within:bg-white/[0.04] hover:border-white/[0.12]"
      >
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 shrink-0 text-emerald-400" />
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Добавить в список... (Enter для сохранения)"
            required
            disabled={!canEdit}
            className="flex-1 border-0 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
          <Button type="submit" size="icon" variant="ghost" disabled={isPending || !canEdit}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="2 шт / 1 кг" disabled={!canEdit} />
        <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Категория" disabled={!canEdit} />
      </div>
    </form>
  );
}
