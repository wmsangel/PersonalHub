import { Gift } from "lucide-react";
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
    <section className="grid gap-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-pink-500/20 bg-pink-500/10">
            <Gift className="h-6 w-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Вишлисты</h1>
            <p className="mt-0.5 text-sm text-white/40">Управляйте списками желаний и резервируйте подарки.</p>
          </div>
        </div>
        <WishlistDialog mode="wishlist" canEdit={canEditWishlists} />
      </div>

      {wishlists.length === 0 ? (
        <Card className="grid justify-items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-10 text-center">
          <Gift className="h-10 w-10 text-white/35" />
          <p className="text-base font-medium text-white">Пока нет вишлистов</p>
          <p className="text-sm text-white/40">Создай первый список желаний для семьи.</p>
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
