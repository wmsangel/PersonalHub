CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#64748b',
  icon TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id, kind, name)
);

CREATE INDEX IF NOT EXISTS idx_finance_categories_family_kind
  ON public.finance_categories (family_id, kind);

CREATE INDEX IF NOT EXISTS idx_finance_categories_family_name
  ON public.finance_categories (family_id, name);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS finance_categories_select ON public.finance_categories;
DROP POLICY IF EXISTS finance_categories_insert ON public.finance_categories;
DROP POLICY IF EXISTS finance_categories_update ON public.finance_categories;
DROP POLICY IF EXISTS finance_categories_delete ON public.finance_categories;

CREATE POLICY finance_categories_select ON public.finance_categories
FOR SELECT
USING (
  public.is_family_member(family_id)
);

CREATE POLICY finance_categories_insert ON public.finance_categories
FOR INSERT
WITH CHECK (
  public.is_family_admin(family_id)
);

CREATE POLICY finance_categories_update ON public.finance_categories
FOR UPDATE
USING (
  public.is_family_admin(family_id)
)
WITH CHECK (
  public.is_family_admin(family_id)
);

CREATE POLICY finance_categories_delete ON public.finance_categories
FOR DELETE
USING (
  public.is_family_admin(family_id)
);

INSERT INTO public.finance_categories (family_id, name, kind, color, icon, is_system)
SELECT
  f.id,
  category.name,
  category.kind,
  category.color,
  category.icon,
  true
FROM public.families f
CROSS JOIN (
  VALUES
    ('Salary', 'income', '#22c55e', 'briefcase'),
    ('Freelance', 'income', '#0ea5e9', 'laptop'),
    ('Investments', 'income', '#a855f7', 'chart-line'),
    ('Other income', 'income', '#14b8a6', 'plus-circle'),
    ('Groceries', 'expense', '#f97316', 'shopping-cart'),
    ('Home', 'expense', '#f59e0b', 'home'),
    ('Transport', 'expense', '#3b82f6', 'car'),
    ('Health', 'expense', '#ef4444', 'heart-pulse'),
    ('Education', 'expense', '#8b5cf6', 'graduation-cap'),
    ('Entertainment', 'expense', '#ec4899', 'sparkles'),
    ('Other expenses', 'expense', '#64748b', 'circle')
) AS category(name, kind, color, icon)
ON CONFLICT (family_id, kind, name) DO UPDATE
SET
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  is_system = true;
