CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Список покупок',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  added_by UUID REFERENCES public.family_members(id),
  checked_by UUID REFERENCES public.family_members(id),
  title TEXT NOT NULL,
  quantity TEXT,
  category TEXT,
  is_checked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shopping_lists_all ON public.shopping_lists;
DROP POLICY IF EXISTS shopping_items_select ON public.shopping_items;
DROP POLICY IF EXISTS shopping_items_insert ON public.shopping_items;
DROP POLICY IF EXISTS shopping_items_update ON public.shopping_items;
DROP POLICY IF EXISTS shopping_items_delete ON public.shopping_items;

CREATE POLICY shopping_lists_all ON public.shopping_lists
  USING (public.is_family_member(family_id))
  WITH CHECK (public.is_family_member(family_id));

CREATE POLICY shopping_items_select ON public.shopping_items
  FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM public.shopping_lists WHERE public.is_family_member(family_id)
    )
  );

CREATE POLICY shopping_items_insert ON public.shopping_items
  FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM public.shopping_lists WHERE public.is_family_member(family_id)
    )
  );

CREATE POLICY shopping_items_update ON public.shopping_items
  FOR UPDATE
  USING (
    list_id IN (
      SELECT id FROM public.shopping_lists WHERE public.is_family_member(family_id)
    )
  );

CREATE POLICY shopping_items_delete ON public.shopping_items
  FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM public.shopping_lists WHERE public.is_family_member(family_id)
    )
  );
