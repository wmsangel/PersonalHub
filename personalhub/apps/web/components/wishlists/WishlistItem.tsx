"use client";

import { Gift, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteWishlistItemAction, toggleReserveWishlistItemAction } from "@/lib/actions/wishlists";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type WishlistItemProps = {
  item: {
    id: string;
    title: string;
    url: string | null;
    price: string | null;
    currency: string;
    priority: "low" | "medium" | "high";
    is_reserved: boolean;
    reserved_by: string | null;
  };
  reservedByLabel?: string;
  isReservedByMe: boolean;
  canEdit?: boolean;
  onUpdated?: () => void;
};

const priorityVariant = (priority: WishlistItemProps["item"]["priority"]) => {
  if (priority === "high") return "destructive" as const;
  if (priority === "medium") return "secondary" as const;
  return "outline" as const;
};

const formatMoney = (value: string | null, currency: string): string | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency || "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
};

export function WishlistItem({ item, reservedByLabel, isReservedByMe, canEdit = true, onUpdated }: WishlistItemProps) {
  const priceLabel = formatMoney(item.price, item.currency);

  return (
    <li
      className="group relative overflow-hidden rounded-xl border border-white/[0.07]
                 bg-white/[0.03] transition-all duration-200
                 hover:border-white/[0.10] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
    >
      <div className="aspect-square bg-white/[0.02] flex items-center justify-center">
        <Gift className="h-12 w-12 text-white/10" />
      </div>

      {item.is_reserved && !isReservedByMe ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <Lock className="mx-auto mb-2 h-6 w-6 text-white/60" />
            <p className="text-xs font-medium text-white/80">Уже забронировано</p>
          </div>
        </div>
      ) : null}

      <div className="p-3">
        <p className="mb-1 truncate text-sm font-medium text-white">{item.title}</p>
        {priceLabel ? <p className="text-lg font-bold text-pink-400">{priceLabel}</p> : null}
        <div className="mt-2 flex items-center gap-2 text-xs text-white/35">
          <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
          {item.url ? (
            <a className="underline" href={item.url} target="_blank" rel="noreferrer">
              Ссылка
            </a>
          ) : null}
        </div>

        {item.is_reserved ? (
          <p className="mt-2 text-xs text-white/35">Зарезервировано: {reservedByLabel ?? "участником семьи"}</p>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            className="w-full text-xs"
            variant={item.is_reserved ? "outline" : "default"}
            disabled={!canEdit}
            title={!canEdit ? "Только чтение" : undefined}
            onClick={async () => {
              if (!canEdit) {
                toast.error("Недостаточно прав для редактирования");
                return;
              }

              const reserveNext = item.is_reserved ? isReservedByMe : true;
              const result = await toggleReserveWishlistItemAction(item.id, reserveNext);
              if (result.error) {
                toast.error(result.error);
                return;
              }

              toast.success(reserveNext ? "Подарок зарезервирован" : "Резерв снят");
              onUpdated?.();
            }}
          >
            {item.is_reserved ? (isReservedByMe ? "Снять резерв" : "Занято") : "Подарю я"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={!canEdit}
            title={!canEdit ? "Только чтение" : undefined}
            onClick={async () => {
              if (!canEdit) {
                toast.error("Недостаточно прав для редактирования");
                return;
              }

              const result = await deleteWishlistItemAction(item.id);
              if (result.error) {
                toast.error(result.error);
                return;
              }

              toast.success("Подарок удалён");
              onUpdated?.();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
