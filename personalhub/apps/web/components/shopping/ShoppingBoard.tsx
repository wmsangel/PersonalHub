"use client";

import { useMemo, useTransition } from "react";
import { ShoppingCart, Sparkles } from "lucide-react";
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
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-emerald-500/18 bg-emerald-500/10">
              <ShoppingCart className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/34">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                живой список
              </div>
              <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">Покупки</h1>
              <p className="mt-1 text-sm text-white/42">В реальном времени для всех участников семьи.</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/16 bg-emerald-400/8 px-3 py-1.5 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
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

      <Card className="p-5 sm:p-6">
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
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[1.4rem] border border-white/8 bg-white/[0.02] text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-emerald-500/10 text-emerald-300">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-lg font-medium text-white">Список пока пуст</p>
            <p className="mt-2 text-sm text-white/42">Добавь первый товар, и он сразу появится у всех участников.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {grouped.map(([category, groupItems]) => (
              <section key={category} className="grid gap-2">
                <h2 className="text-sm font-semibold text-white/75">{category}</h2>
                <ul className="rounded-[1.2rem] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
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
