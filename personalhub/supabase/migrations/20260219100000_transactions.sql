CREATE OR REPLACE FUNCTION public.validate_transaction_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  category_kind TEXT;
  category_family_id UUID;
  account_family_id UUID;
BEGIN
  SELECT fc.kind, fc.family_id
  INTO category_kind, category_family_id
  FROM public.finance_categories fc
  WHERE fc.id = NEW.category_id;

  IF category_kind IS NULL THEN
    RAISE EXCEPTION 'finance category % not found', NEW.category_id;
  END IF;

  IF category_kind <> NEW.kind THEN
    RAISE EXCEPTION 'transaction kind "%" does not match category kind "%"', NEW.kind, category_kind;
  END IF;

  IF category_family_id <> NEW.family_id THEN
    RAISE EXCEPTION 'category family mismatch';
  END IF;

  SELECT a.family_id
  INTO account_family_id
  FROM public.accounts a
  WHERE a.id = NEW.account_id;

  IF account_family_id IS NULL THEN
    RAISE EXCEPTION 'account % not found', NEW.account_id;
  END IF;

  IF account_family_id <> NEW.family_id THEN
    RAISE EXCEPTION 'account family mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  title TEXT NOT NULL,
  note TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_family_date
  ON public.transactions (family_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_account_date
  ON public.transactions (account_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category_id
  ON public.transactions (category_id);

DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS transactions_validate_consistency ON public.transactions;
CREATE TRIGGER transactions_validate_consistency
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_consistency();

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transactions_select ON public.transactions;
DROP POLICY IF EXISTS transactions_insert ON public.transactions;
DROP POLICY IF EXISTS transactions_update ON public.transactions;
DROP POLICY IF EXISTS transactions_delete ON public.transactions;

CREATE POLICY transactions_select ON public.transactions
FOR SELECT
USING (
  public.is_family_member(family_id)
);

CREATE POLICY transactions_insert ON public.transactions
FOR INSERT
WITH CHECK (
  public.can_edit_module(family_id, 'finances')
);

CREATE POLICY transactions_update ON public.transactions
FOR UPDATE
USING (
  public.can_edit_module(family_id, 'finances')
)
WITH CHECK (
  public.can_edit_module(family_id, 'finances')
);

CREATE POLICY transactions_delete ON public.transactions
FOR DELETE
USING (
  public.can_edit_module(family_id, 'finances')
);
