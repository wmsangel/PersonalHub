-- PersonalHub MVP: family invites with RLS and dedupe

CREATE TABLE IF NOT EXISTS public.family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'adult', 'child', 'guest')),
  nickname TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_invites_family_status
  ON public.family_invites(family_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_family_invites_pending_email
  ON public.family_invites(family_id, lower(invited_email))
  WHERE status = 'pending';

ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS family_invites_select ON public.family_invites;
DROP POLICY IF EXISTS family_invites_insert ON public.family_invites;
DROP POLICY IF EXISTS family_invites_update ON public.family_invites;
DROP POLICY IF EXISTS family_invites_delete ON public.family_invites;

CREATE POLICY family_invites_select ON public.family_invites
FOR SELECT
USING (
  public.is_family_admin(family_id)
  OR invited_user_id = auth.uid()
  OR lower(invited_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
);

CREATE POLICY family_invites_insert ON public.family_invites
FOR INSERT
WITH CHECK (
  public.is_family_admin(family_id)
  AND invited_by = auth.uid()
);

CREATE POLICY family_invites_update ON public.family_invites
FOR UPDATE
USING (
  public.is_family_admin(family_id)
  OR invited_user_id = auth.uid()
)
WITH CHECK (
  public.is_family_admin(family_id)
  OR (
    invited_user_id = auth.uid()
    AND status = 'accepted'
  )
);

CREATE POLICY family_invites_delete ON public.family_invites
FOR DELETE
USING (
  public.is_family_admin(family_id)
);
