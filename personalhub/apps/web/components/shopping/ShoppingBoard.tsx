"use client";

import { useMemo, useTransition } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  addShoppingItemAction,
  clearCheckedShoppingItemsAction,
  deleteShoppingItemAction,
  toggleShoppingItemAction,
} from "@/lib/actions/shopping";
import { useShoppingList } from "@/hooks/useShoppingList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddItemForm } from "./AddItemForm";
import { ShoppingItem } from "./ShoppingItem";

type ShoppingBoardProps = {
  listId: string;
  canEdit?: boolean;
};

export function ShoppingBoard({ listId, canEdit = true }: ShoppingBoardProps) {
  const { items, isLoading } = useShoppingList(listId);
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();

    items.forEach((item) => {
      const key = item.category?.trim() || "Без категории";
      const current = map.get(key) ?? [];
      map.set(key, [...current, item]);
    });

    return Array.from(map.entries());
  }, [items]);

  const pendingCount = items.filter((item) => !item.is_checked).length;

  return (
    <section className="grid gap-6">
      <Card className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <ShoppingCart className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Покупки</h1>
              <p className="mt-0.5 text-sm text-white/40">В реальном времени для всех участников семьи.</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            online
          </div>
        </div>

        <AddItemForm
          canEdit={canEdit}
          isPending={isPending}
          onAdd={async (payload) => {
            if (!canEdit) {
              toast.error("Недостаточно прав для редактирования");
              return;
            }

            startTransition(async () => {
              const result = await addShoppingItemAction({
                listId,
                title: payload.title,
                quantity: payload.quantity,
                category: payload.category,
              });

              if (result.error) {
                toast.error(result.error);
                return;
              }

              toast.success("Товар добавлен в список");
            });
          }}
        />
      </Card>

      <Card className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/45">Непокупленного: {pendingCount}</p>
          <Button
            variant="outline"
            disabled={isPending || !canEdit}
            title={!canEdit ? "Только чтение" : undefined}
            onClick={() => {
              if (!canEdit) {
                toast.error("Недостаточно прав для редактирования");
                return;
              }

              startTransition(async () => {
                const result = await clearCheckedShoppingItemsAction(listId);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }

                toast.success("Купленные товары очищены");
              });
            }}
          >
            Очистить купленное
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-white/45">Загрузка списка...</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-white/45">Список пуст. Добавь первый товар.</p>
        ) : (
          <div className="grid gap-5">
            {grouped.map(([category, groupItems]) => (
              <section key={category} className="grid gap-2">
                <h2 className="text-sm font-semibold text-white/75">{category}</h2>
                <ul className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  {groupItems.map((item) => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      canEdit={canEdit}
                      onToggle={(itemId, nextChecked) => {
                        if (!canEdit) {
                          toast.error("Недостаточно прав для редактирования");
                          return;
                        }

                        startTransition(async () => {
                          const result = await toggleShoppingItemAction({ itemId, isChecked: nextChecked });
                          if (result.error) {
                            toast.error(result.error);
                            return;
                          }

                          toast.success("Список обновлён");
                        });
                      }}
                      onDelete={(itemId) => {
                        if (!canEdit) {
                          toast.error("Недостаточно прав для редактирования");
                          return;
                        }

                        startTransition(async () => {
                          const result = await deleteShoppingItemAction(itemId);
                          if (result.error) {
                            toast.error(result.error);
                            return;
                          }

                          toast.success("Товар удалён");
                        });
                      }}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
