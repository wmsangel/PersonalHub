import { notFound, redirect } from "next/navigation";
import { ShoppingBoard } from "@/components/shopping/ShoppingBoard";
import { NoFamilyState } from "@/components/layout/NoFamilyState";
import { getOrCreateActiveShoppingListAction } from "@/lib/actions/shopping";
import { assertCanViewModule, canEditModule } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ShoppingPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const membership = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership.data) {
    return <NoFamilyState />;
  }

  const permission = await supabase
    .from("member_permissions")
    .select("can_view, can_edit")
    .eq("member_id", membership.data.id)
    .eq("module", "shopping")
    .limit(1)
    .maybeSingle();

  const modulePermissions = {
    shopping: {
      canView: permission.data?.can_view ?? membership.data.role === "admin",
      canEdit: permission.data?.can_edit ?? membership.data.role === "admin",
    },
  };

  try {
    assertCanViewModule(modulePermissions, "shopping");
  } catch {
    notFound();
  }
  const canEditShopping = canEditModule(modulePermissions, "shopping");

  const listResult = await getOrCreateActiveShoppingListAction();

  if (listResult.error || !listResult.data) {
    return (
      <section className="rounded-xl border bg-card p-6">
        <h1 className="text-2xl font-semibold">Покупки</h1>
        <p className="mt-2 text-sm text-destructive">{listResult.error ?? "Не удалось загрузить список покупок"}</p>
      </section>
    );
  }

  return <ShoppingBoard listId={listResult.data.id} canEdit={canEditShopping} />;
}
