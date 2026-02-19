"use client";

import { useRouter } from "next/navigation";
import { Lock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WishlistDialog } from "./WishlistDialog";
import { WishlistItem } from "./WishlistItem";

type WishlistCardProps = {
  wishlist: {
    id: string;
    title: string;
    is_shared: boolean;
    owner_member_id: string;
    items: Array<{
      id: string;
      title: string;
      url: string | null;
      price: string | null;
      currency: string;
      priority: "low" | "medium" | "high";
      is_reserved: boolean;
      reserved_by: string | null;
    }>;
  };
  ownerLabel: string;
  currentMemberId: string;
  memberLabels: Map<string, string>;
  canEdit?: boolean;
};

export function WishlistCard({ wishlist, ownerLabel, currentMemberId, memberLabels, canEdit = true }: WishlistCardProps) {
  const router = useRouter();

  return (
    <Card className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{wishlist.title}</h3>
          <p className="mt-1 flex items-center gap-2 text-xs text-white/40">
            {wishlist.is_shared ? <Users className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {wishlist.is_shared ? "Общий" : "Приватный"} · Владелец: {ownerLabel}
          </p>
        </div>
        <WishlistDialog mode="item" wishlistId={wishlist.id} canEdit={canEdit} />
      </div>

      {wishlist.items.length === 0 ? (
        <p className="text-sm text-white/40">Список пока пуст.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.items.map((item) => (
            <WishlistItem
              key={item.id}
              item={item}
              reservedByLabel={item.reserved_by ? memberLabels.get(item.reserved_by) ?? "участник семьи" : undefined}
              isReservedByMe={Boolean(item.reserved_by && item.reserved_by === currentMemberId)}
              canEdit={canEdit}
              onUpdated={() => router.refresh()}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
