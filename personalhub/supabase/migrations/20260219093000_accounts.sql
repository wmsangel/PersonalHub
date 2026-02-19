CREATE OR REPLACE FUNCTION public.can_edit_module(target_family_id UUID, target_module TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm
    JOIN public.member_permissions mp
      ON mp.member_id = fm.id
     AND mp.family_id = fm.family_id
    WHERE fm.family_id = target_family_id
      AND fm.user_id = auth.uid()
      AND fm.is_active = true
      AND mp.module = target_module
      AND mp.can_edit = true
  );
$$;

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'card', 'deposit', 'savings')),
  currency TEXT NOT NULL DEFAULT 'RUB' CHECK (char_length(currency) = 3),
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_family_id
  ON public.accounts (family_id);

CREATE INDEX IF NOT EXISTS idx_accounts_family_type
  ON public.accounts (family_id, type);

CREATE INDEX IF NOT EXISTS idx_accounts_family_archived
  ON public.accounts (family_id, is_archived);

DROP TRIGGER IF EXISTS accounts_updated_at ON public.accounts;
CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounts_select ON public.accounts;
DROP POLICY IF EXISTS accounts_insert ON public.accounts;
DROP POLICY IF EXISTS accounts_update ON public.accounts;
DROP POLICY IF EXISTS accounts_delete ON public.accounts;

CREATE POLICY accounts_select ON public.accounts
FOR SELECT
USING (
  public.is_family_member(family_id)
);

CREATE POLICY accounts_insert ON public.accounts
FOR INSERT
WITH CHECK (
  public.can_edit_module(family_id, 'finances')
);

CREATE POLICY accounts_update ON public.accounts
FOR UPDATE
USING (
  public.can_edit_module(family_id, 'finances')
)
WITH CHECK (
  public.can_edit_module(family_id, 'finances')
);

CREATE POLICY accounts_delete ON public.accounts
FOR DELETE
USING (
  public.can_edit_module(family_id, 'finances')
);
