import { Gift, Sparkles } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { WishlistCard } from "@/components/wishlists/WishlistCard";
import { WishlistDialog } from "@/components/wishlists/WishlistDialog";
import { NoFamilyState } from "@/components/layout/NoFamilyState";
import { Card } from "@/components/ui/card";
import { getWishlistsAction } from "@/lib/actions/wishlists";
import { assertCanViewModule, canEditModule } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type WishlistRow = {
  id: string;
  owner_member_id: string;
  title: string;
  is_shared: boolean;
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

export default async function WishlistsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const membership = await supabase
    .from("family_members")
    .select("id, family_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership.data) {
    return <NoFamilyState />;
  }
  const membershipData = membership.data;

  const permission = await supabase
    .from("member_permissions")
    .select("can_view, can_edit")
    .eq("member_id", membershipData.id)
    .eq("module", "wishlists")
    .limit(1)
    .maybeSingle();

  const modulePermissions = {
    wishlists: {
      canView: permission.data?.can_view ?? membership.data.role === "admin",
      canEdit: permission.data?.can_edit ?? membership.data.role === "admin",
    },
  };

  try {
    assertCanViewModule(modulePermissions, "wishlists");
  } catch {
    notFound();
  }
  const canEditWishlists = canEditModule(modulePermissions, "wishlists");

  const [wishlistsResult, membersResult] = await Promise.all([
    getWishlistsAction(),
    supabase
      .from("family_members")
      .select("id, nickname, profiles(full_name)")
      .eq("family_id", membershipData.family_id)
      .eq("is_active", true),
  ]);

  if (wishlistsResult.error || membersResult.error) {
    return (
      <section className="grid gap-4">
        <h1 className="text-2xl font-semibold">Вишлисты</h1>
        <Card className="p-4 text-sm text-destructive">{wishlistsResult.error ?? membersResult.error?.message}</Card>
      </section>
    );
  }

  const wishlists = (wishlistsResult.data ?? []) as WishlistRow[];
  const memberLabels = new Map<string, string>(
    (membersResult.data ?? []).map((member) => {
      const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
      return [member.id, member.nickname || profile?.full_name || "Участник"];
    }),
  );

  return (
    <section className="grid gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-pink-500/18 bg-pink-500/10">
            <Gift className="h-6 w-6 text-pink-400" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/34">
              <Sparkles className="h-3.5 w-3.5 text-pink-300" />
              желания и подарки
            </div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">Вишлисты</h1>
            <p className="mt-1 text-sm text-white/42">Управляйте списками желаний и резервируйте подарки без пересечений.</p>
          </div>
        </div>
        <WishlistDialog mode="wishlist" canEdit={canEditWishlists} />
      </div>

      {wishlists.length === 0 ? (
        <Card className="grid justify-items-center gap-2 p-10 text-center">
          <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-pink-500/10 text-pink-300">
            <Gift className="h-8 w-8" />
          </div>
          <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">Пока нет вишлистов</p>
          <p className="max-w-md text-sm leading-7 text-white/42">Создайте первый список желаний для семьи и начните резервировать подарки без накладок.</p>
          <WishlistDialog mode="wishlist" canEdit={canEditWishlists} />
        </Card>
      ) : (
        <div className="grid gap-3">
          {wishlists.map((wishlist) => (
            <WishlistCard
              key={wishlist.id}
              wishlist={wishlist}
              ownerLabel={memberLabels.get(wishlist.owner_member_id) ?? "Участник"}
              currentMemberId={membershipData.id}
              memberLabels={memberLabels}
              canEdit={canEditWishlists}
            />
          ))}
        </div>
      )}
    </section>
  );
}
