CREATE OR REPLACE FUNCTION public.enforce_wishlist_item_update_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  wishlist_row RECORD;
  is_admin BOOLEAN;
  is_owner BOOLEAN;
  current_member_id UUID;
BEGIN
  SELECT w.id, w.family_id, w.owner_member_id, w.is_shared
  INTO wishlist_row
  FROM public.wishlists w
  WHERE w.id = COALESCE(NEW.wishlist_id, OLD.wishlist_id);

  IF wishlist_row.id IS NULL THEN
    RAISE EXCEPTION 'wishlist % not found', COALESCE(NEW.wishlist_id, OLD.wishlist_id);
  END IF;

  is_admin := public.is_family_admin(wishlist_row.family_id);

  SELECT fm.id
  INTO current_member_id
  FROM public.family_members fm
  WHERE fm.family_id = wishlist_row.family_id
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
  LIMIT 1;

  is_owner := current_member_id = wishlist_row.owner_member_id;

  IF is_admin OR is_owner THEN
    RETURN NEW;
  END IF;

  IF NOT wishlist_row.is_shared THEN
    RAISE EXCEPTION 'private wishlist items can only be updated by owner or admin';
  END IF;

  IF NEW.title IS DISTINCT FROM OLD.title
    OR NEW.url IS DISTINCT FROM OLD.url
    OR NEW.price IS DISTINCT FROM OLD.price
    OR NEW.currency IS DISTINCT FROM OLD.currency
    OR NEW.priority IS DISTINCT FROM OLD.priority THEN
    RAISE EXCEPTION 'only owner or admin can edit item details';
  END IF;

  IF NEW.is_reserved = true THEN
    IF current_member_id IS NULL OR NEW.reserved_by IS DISTINCT FROM current_member_id THEN
      RAISE EXCEPTION 'reserved_by must be current member';
    END IF;
  ELSE
    IF NEW.reserved_by IS NOT NULL THEN
      RAISE EXCEPTION 'reserved_by must be null when is_reserved is false';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlists_family_id
  ON public.wishlists (family_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_owner_member_id
  ON public.wishlists (owner_member_id);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  price NUMERIC(14, 2) CHECK (price IS NULL OR price >= 0),
  currency TEXT NOT NULL DEFAULT 'RUB' CHECK (char_length(currency) = 3),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_reserved BOOLEAN NOT NULL DEFAULT false,
  reserved_by UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id
  ON public.wishlist_items (wishlist_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_reserved_by
  ON public.wishlist_items (reserved_by);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_reserved_state
  ON public.wishlist_items (is_reserved);

DROP TRIGGER IF EXISTS wishlist_items_enforce_update_rules ON public.wishlist_items;
CREATE TRIGGER wishlist_items_enforce_update_rules
  BEFORE UPDATE ON public.wishlist_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_wishlist_item_update_rules();

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wishlists_select ON public.wishlists;
DROP POLICY IF EXISTS wishlists_insert ON public.wishlists;
DROP POLICY IF EXISTS wishlists_update ON public.wishlists;
DROP POLICY IF EXISTS wishlists_delete ON public.wishlists;

CREATE POLICY wishlists_select ON public.wishlists
FOR SELECT
USING (
  public.is_family_admin(family_id)
  OR EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.id = owner_member_id
      AND fm.user_id = auth.uid()
      AND fm.is_active = true
  )
  OR (is_shared = true AND public.is_family_member(family_id))
);

CREATE POLICY wishlists_insert ON public.wishlists
FOR INSERT
WITH CHECK (
  public.is_family_admin(family_id)
  OR EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.id = owner_member_id
      AND fm.family_id = family_id
      AND fm.user_id = auth.uid()
      AND fm.is_active = true
  )
);

CREATE POLICY wishlists_update ON public.wishlists
FOR UPDATE
USING (
  public.is_family_admin(family_id)
  OR EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.id = owner_member_id
      AND fm.user_id = auth.uid()
      AND fm.is_active = true
  )
)
WITH CHECK (
  public.is_family_admin(family_id)
  OR EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.id = owner_member_id
      AND fm.family_id = family_id
      AND fm.user_id = auth.uid()
      AND fm.is_active = true
  )
);

CREATE POLICY wishlists_delete ON public.wishlists
FOR DELETE
USING (
  public.is_family_admin(family_id)
  OR EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.id = owner_member_id
      AND fm.user_id = auth.uid()
      AND fm.is_active = true
  )
);

DROP POLICY IF EXISTS wishlist_items_select ON public.wishlist_items;
DROP POLICY IF EXISTS wishlist_items_insert ON public.wishlist_items;
DROP POLICY IF EXISTS wishlist_items_update ON public.wishlist_items;
DROP POLICY IF EXISTS wishlist_items_delete ON public.wishlist_items;

CREATE POLICY wishlist_items_select ON public.wishlist_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.wishlists w
    WHERE w.id = wishlist_id
      AND (
        public.is_family_admin(w.family_id)
        OR EXISTS (
          SELECT 1
          FROM public.family_members fm
          WHERE fm.id = w.owner_member_id
            AND fm.user_id = auth.uid()
            AND fm.is_active = true
        )
        OR (w.is_shared = true AND public.is_family_member(w.family_id))
      )
  )
);

CREATE POLICY wishlist_items_insert ON public.wishlist_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.wishlists w
    WHERE w.id = wishlist_id
      AND (
        public.is_family_admin(w.family_id)
        OR EXISTS (
          SELECT 1
          FROM public.family_members fm
          WHERE fm.id = w.owner_member_id
            AND fm.user_id = auth.uid()
            AND fm.is_active = true
        )
      )
  )
);

CREATE POLICY wishlist_items_update ON public.wishlist_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.wishlists w
    WHERE w.id = wishlist_id
      AND (
        public.is_family_admin(w.family_id)
        OR EXISTS (
          SELECT 1
          FROM public.family_members fm
          WHERE fm.id = w.owner_member_id
            AND fm.user_id = auth.uid()
            AND fm.is_active = true
        )
        OR (w.is_shared = true AND public.is_family_member(w.family_id))
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.wishlists w
    WHERE w.id = wishlist_id
      AND (
        public.is_family_admin(w.family_id)
        OR EXISTS (
          SELECT 1
          FROM public.family_members fm
          WHERE fm.id = w.owner_member_id
            AND fm.user_id = auth.uid()
            AND fm.is_active = true
        )
        OR (w.is_shared = true AND public.is_family_member(w.family_id))
      )
  )
);

CREATE POLICY wishlist_items_delete ON public.wishlist_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.wishlists w
    WHERE w.id = wishlist_id
      AND (
        public.is_family_admin(w.family_id)
        OR EXISTS (
          SELECT 1
          FROM public.family_members fm
          WHERE fm.id = w.owner_member_id
            AND fm.user_id = auth.uid()
            AND fm.is_active = true
        )
      )
  )
);
