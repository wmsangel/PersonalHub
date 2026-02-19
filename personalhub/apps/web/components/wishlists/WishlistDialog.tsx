"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { createWishlistAction, createWishlistItemAction } from "@/lib/actions/wishlists";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WishlistDialogProps =
  | {
      mode: "wishlist";
      canEdit?: boolean;
    }
  | {
      mode: "item";
      wishlistId: string;
      canEdit?: boolean;
    };

export function WishlistDialog(props: WishlistDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const canEdit = props.canEdit ?? true;

  const title = props.mode === "wishlist" ? "Новый вишлист" : "Новый подарок";
  const description =
    props.mode === "wishlist" ? "Создай личный или общий список желаний." : "Добавь новую позицию в текущий список.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-testid={props.mode === "wishlist" ? "wishlist-create-button" : "wishlist-add-item-button"}
          size="sm"
          disabled={!canEdit}
          title={!canEdit ? "Только чтение" : undefined}
        >
          <Plus className="mr-2 h-4 w-4" />
          {props.mode === "wishlist" ? "Добавить вишлист" : "Добавить подарок"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {props.mode === "wishlist" ? (
          <form
            id="wishlist-create-form"
            className="grid gap-4"
            action={(formData) => {
              if (!canEdit) {
                toast.error("Недостаточно прав для редактирования");
                return;
              }

              startTransition(async () => {
                const wishlistTitle = String(formData.get("title") ?? "").trim();
                const isShared = String(formData.get("is_shared") ?? "false") === "true";
                const result = await createWishlistAction({ title: wishlistTitle, is_shared: isShared });

                if (result.error) {
                  toast.error(result.error);
                  return;
                }

                toast.success("Вишлист создан");
                setOpen(false);
                router.refresh();
              });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="wishlist-title">Название</Label>
              <Input id="wishlist-title" name="title" placeholder="Например: День рождения" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wishlist-shared">Доступ</Label>
              <select id="wishlist-shared" name="is_shared" defaultValue="false" className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="false">Приватный</option>
                <option value="true">Общий</option>
              </select>
            </div>
          </form>
        ) : (
          <form
            id="wishlist-item-create-form"
            className="grid gap-4"
            action={(formData) => {
              if (!canEdit) {
                toast.error("Недостаточно прав для редактирования");
                return;
              }

              startTransition(async () => {
                const itemTitle = String(formData.get("title") ?? "").trim();
                const url = String(formData.get("url") ?? "").trim();
                const priceRaw = String(formData.get("price") ?? "").trim();
                const currency = String(formData.get("currency") ?? "RUB").trim();
                const priority = String(formData.get("priority") ?? "medium") as "low" | "medium" | "high";
                const result = await createWishlistItemAction({
                  wishlist_id: props.wishlistId,
                  title: itemTitle,
                  url: url || undefined,
                  price: priceRaw ? Number(priceRaw) : undefined,
                  currency,
                  priority,
                });

                if (result.error) {
                  toast.error(result.error);
                  return;
                }

                toast.success("Подарок добавлен");
                setOpen(false);
                router.refresh();
              });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="item-title">Название</Label>
              <Input id="item-title" name="title" placeholder="Например: Наушники" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-url">Ссылка</Label>
              <Input id="item-url" name="url" placeholder="https://..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-price">Цена</Label>
              <Input id="item-price" name="price" type="number" min="0" step="0.01" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-currency">Валюта</Label>
              <Input id="item-currency" name="currency" defaultValue="RUB" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-priority">Приоритет</Label>
              <select id="item-priority" name="priority" defaultValue="medium" className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>
          </form>
        )}

        <DialogFooter>
          <Button type="submit" form={props.mode === "wishlist" ? "wishlist-create-form" : "wishlist-item-create-form"} disabled={isPending || !canEdit}>
            {props.mode === "wishlist" ? <Gift className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
