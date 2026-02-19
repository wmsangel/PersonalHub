CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT,
  is_shared BOOLEAN DEFAULT false,
  pinned BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS notes_updated_at ON public.notes;
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notes_select ON public.notes;
DROP POLICY IF EXISTS notes_insert ON public.notes;
DROP POLICY IF EXISTS notes_update ON public.notes;
DROP POLICY IF EXISTS notes_delete ON public.notes;

CREATE POLICY notes_select ON public.notes
  FOR SELECT
  USING (
    public.is_family_member(family_id) AND (
      is_shared = true OR created_by = auth.uid()
    )
  );

CREATE POLICY notes_insert ON public.notes
  FOR INSERT
  WITH CHECK (public.is_family_member(family_id));

CREATE POLICY notes_update ON public.notes
  FOR UPDATE
  USING (created_by = auth.uid() OR public.is_family_admin(family_id));

CREATE POLICY notes_delete ON public.notes
  FOR DELETE
  USING (created_by = auth.uid() OR public.is_family_admin(family_id));
