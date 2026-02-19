import { redirect } from "next/navigation";
import { ActionToast } from "@/components/providers/ActionToast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { acceptInviteAction, signOutAction } from "../../actions";
import { INVITED_PROFILE_PLACEHOLDER } from "../../constants";
import { getSupabaseServerClient } from "../../../lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const readParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export default async function AcceptInvitePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = readParam(params.status);
  const message = readParam(params.message);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const profileResult = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileResult.data ?? null;

  const membershipResult = await supabase
    .from("family_members")
    .select("id, family_id, role, nickname")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const membership = membershipResult.data ?? null;

  if (!membership) {
    redirect("/dashboard");
  }

  if (profile?.full_name && profile.full_name !== INVITED_PROFILE_PLACEHOLDER) {
    redirect("/dashboard");
  }

  const familyResult = await supabase
    .from("families")
    .select("name")
    .eq("id", membership.family_id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-12">
      <ActionToast status={status} message={message} />

      <h1 className="mb-2 text-4xl font-semibold">Accept Invitation</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        You were added to <strong>{familyResult.data?.name ?? "a family"}</strong> as <strong>{membership.role}</strong>.
      </p>

      {message ? (
        <section
          className={`mb-5 rounded-md border px-4 py-3 text-sm ${
            status === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-green-500/30 bg-green-500/10 text-green-700"
          }`}
        >
          {message}
        </section>
      ) : null}

      <Card className="p-4">
        <form action={acceptInviteAction} className="grid gap-3">
          <Input
            name="full_name"
            type="text"
            placeholder="Your full name"
            defaultValue={profile?.full_name === INVITED_PROFILE_PLACEHOLDER ? "" : (profile?.full_name ?? "")}
            required
          />
          <Input name="nickname" type="text" placeholder="Nickname in family" defaultValue={membership.nickname ?? ""} />
          <Button type="submit">Accept and continue</Button>
        </form>
      </Card>

      <form action={signOutAction} className="mt-3">
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  );
}
