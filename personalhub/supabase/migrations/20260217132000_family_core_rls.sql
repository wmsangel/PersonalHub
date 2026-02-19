-- PersonalHub MVP RLS (profiles, families, family_members)

-- Helper functions run with definer privileges to avoid policy recursion.
CREATE OR REPLACE FUNCTION public.is_family_member(target_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = target_family_id
      AND fm.user_id = auth.uid()
      AND fm.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_admin(target_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = target_family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'admin'
      AND fm.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members me
    JOIN public.family_members target
      ON target.family_id = me.family_id
    WHERE me.user_id = auth.uid()
      AND me.is_active = true
      AND target.user_id = target_user_id
      AND target.is_active = true
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
FOR SELECT
USING (
  id = auth.uid() OR public.can_view_profile(id)
);

CREATE POLICY profiles_insert ON public.profiles
FOR INSERT
WITH CHECK (
  id = auth.uid()
);

CREATE POLICY profiles_update ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
);

DROP POLICY IF EXISTS families_select ON public.families;
DROP POLICY IF EXISTS families_insert ON public.families;
DROP POLICY IF EXISTS families_update ON public.families;
DROP POLICY IF EXISTS families_delete ON public.families;

CREATE POLICY families_select ON public.families
FOR SELECT
USING (
  public.is_family_member(id)
);

CREATE POLICY families_insert ON public.families
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY families_update ON public.families
FOR UPDATE
USING (
  public.is_family_admin(id) OR created_by = auth.uid()
)
WITH CHECK (
  public.is_family_admin(id) OR created_by = auth.uid()
);

CREATE POLICY families_delete ON public.families
FOR DELETE
USING (
  public.is_family_admin(id) OR created_by = auth.uid()
);

DROP POLICY IF EXISTS family_members_select ON public.family_members;
DROP POLICY IF EXISTS family_members_insert ON public.family_members;
DROP POLICY IF EXISTS family_members_update ON public.family_members;
DROP POLICY IF EXISTS family_members_delete ON public.family_members;

CREATE POLICY family_members_select ON public.family_members
FOR SELECT
USING (
  public.is_family_member(family_id)
);

CREATE POLICY family_members_insert ON public.family_members
FOR INSERT
WITH CHECK (
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.families f
      WHERE f.id = family_id
        AND f.created_by = auth.uid()
    )
  )
  OR public.is_family_admin(family_id)
);

CREATE POLICY family_members_update ON public.family_members
FOR UPDATE
USING (
  public.is_family_admin(family_id)
)
WITH CHECK (
  public.is_family_admin(family_id)
);

CREATE POLICY family_members_delete ON public.family_members
FOR DELETE
USING (
  public.is_family_admin(family_id)
);
