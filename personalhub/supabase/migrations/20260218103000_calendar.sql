CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_time_order CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_events_family_starts_at
  ON public.events (family_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_events_family_ends_at
  ON public.events (family_id, ends_at);

CREATE TABLE IF NOT EXISTS public.event_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (event_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_event_visibility_event_id
  ON public.event_visibility (event_id);

CREATE INDEX IF NOT EXISTS idx_event_visibility_member_id
  ON public.event_visibility (member_id);

DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select ON public.events;
DROP POLICY IF EXISTS events_insert ON public.events;
DROP POLICY IF EXISTS events_update ON public.events;
DROP POLICY IF EXISTS events_delete ON public.events;

CREATE POLICY events_select ON public.events
FOR SELECT
USING (
  public.is_family_member(family_id)
  AND (
    NOT EXISTS (
      SELECT 1
      FROM public.event_visibility ev
      WHERE ev.event_id = public.events.id
    )
    OR EXISTS (
      SELECT 1
      FROM public.event_visibility ev
      JOIN public.family_members fm ON fm.id = ev.member_id
      WHERE ev.event_id = public.events.id
        AND fm.user_id = auth.uid()
        AND fm.is_active = true
        AND ev.can_view = true
    )
  )
);

CREATE POLICY events_insert ON public.events
FOR INSERT
WITH CHECK (
  public.is_family_member(family_id)
  AND created_by = auth.uid()
);

CREATE POLICY events_update ON public.events
FOR UPDATE
USING (
  public.is_family_member(family_id)
  AND (
    created_by = auth.uid()
    OR public.is_family_admin(family_id)
    OR EXISTS (
      SELECT 1
      FROM public.event_visibility ev
      JOIN public.family_members fm ON fm.id = ev.member_id
      WHERE ev.event_id = public.events.id
        AND fm.user_id = auth.uid()
        AND fm.is_active = true
        AND ev.can_edit = true
    )
  )
)
WITH CHECK (
  public.is_family_member(family_id)
);

CREATE POLICY events_delete ON public.events
FOR DELETE
USING (
  created_by = auth.uid()
  OR public.is_family_admin(family_id)
);

DROP POLICY IF EXISTS event_visibility_select ON public.event_visibility;
DROP POLICY IF EXISTS event_visibility_insert ON public.event_visibility;
DROP POLICY IF EXISTS event_visibility_update ON public.event_visibility;
DROP POLICY IF EXISTS event_visibility_delete ON public.event_visibility;

CREATE POLICY event_visibility_select ON public.event_visibility
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = event_id
      AND public.is_family_member(e.family_id)
  )
);

CREATE POLICY event_visibility_insert ON public.event_visibility
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = event_id
      AND (
        public.is_family_admin(e.family_id)
        OR e.created_by = auth.uid()
      )
  )
);

CREATE POLICY event_visibility_update ON public.event_visibility
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = event_id
      AND (
        public.is_family_admin(e.family_id)
        OR e.created_by = auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = event_id
      AND (
        public.is_family_admin(e.family_id)
        OR e.created_by = auth.uid()
      )
  )
);

CREATE POLICY event_visibility_delete ON public.event_visibility
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = event_id
      AND (
        public.is_family_admin(e.family_id)
        OR e.created_by = auth.uid()
      )
  )
);
