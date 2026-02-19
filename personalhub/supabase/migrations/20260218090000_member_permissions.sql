CREATE TABLE IF NOT EXISTS public.member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('calendar', 'tasks', 'notes', 'finances', 'wishlists', 'shopping', 'documents')),
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (member_id, module)
);

CREATE INDEX IF NOT EXISTS idx_member_permissions_family_id
  ON public.member_permissions (family_id);

CREATE INDEX IF NOT EXISTS idx_member_permissions_member_id
  ON public.member_permissions (member_id);

CREATE INDEX IF NOT EXISTS idx_member_permissions_module
  ON public.member_permissions (module);

ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_permissions_select ON public.member_permissions;
DROP POLICY IF EXISTS member_permissions_insert ON public.member_permissions;
DROP POLICY IF EXISTS member_permissions_update ON public.member_permissions;
DROP POLICY IF EXISTS member_permissions_delete ON public.member_permissions;

CREATE POLICY member_permissions_select ON public.member_permissions
FOR SELECT
USING (
  public.is_family_member(family_id)
);

CREATE POLICY member_permissions_insert ON public.member_permissions
FOR INSERT
WITH CHECK (
  public.is_family_admin(family_id)
);

CREATE POLICY member_permissions_update ON public.member_permissions
FOR UPDATE
USING (
  public.is_family_admin(family_id)
)
WITH CHECK (
  public.is_family_admin(family_id)
);

CREATE POLICY member_permissions_delete ON public.member_permissions
FOR DELETE
USING (
  public.is_family_admin(family_id)
);
