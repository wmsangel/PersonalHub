CREATE OR REPLACE FUNCTION public.seed_member_permissions_for_role(
  target_family_id UUID,
  target_member_id UUID,
  target_role TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.member_permissions (family_id, member_id, module, can_view, can_edit)
  SELECT
    target_family_id,
    target_member_id,
    module_name,
    can_view,
    can_edit
  FROM (
    VALUES
      (
        'calendar',
        CASE
          WHEN target_role = 'admin' THEN true
          WHEN target_role = 'adult' THEN true
          ELSE false
        END,
        CASE
          WHEN target_role = 'admin' THEN true
          WHEN target_role = 'adult' THEN true
          ELSE false
        END
      ),
      (
        'tasks',
        CASE
          WHEN target_role = 'admin' THEN true
          WHEN target_role IN ('adult', 'child', 'guest') THEN true
          ELSE false
        END,
        CASE
          WHEN target_role = 'admin' THEN true
          WHEN target_role IN ('adult', 'child', 'guest') THEN true
          ELSE false
        END
      ),
      (
        'notes',
        CASE
          WHEN target_role = 'admin' THEN true
          WHEN target_role = 'adult' THEN true
          ELSE false
        END,
        CASE
          WHEN target_role = 'admin' THEN true
          WHEN target_role = 'adult' THEN true
          ELSE false
        END
      ),
      (
        'finances',
        CASE WHEN target_role = 'admin' THEN true ELSE false END,
        CASE WHEN target_role = 'admin' THEN true ELSE false END
      ),
      (
        'wishlists',
        CASE WHEN target_role = 'admin' THEN true ELSE false END,
        CASE WHEN target_role = 'admin' THEN true ELSE false END
      ),
      (
        'shopping',
        CASE
          WHEN target_role = 'admin' THEN true
          WHEN target_role IN ('adult', 'child', 'guest') THEN true
          ELSE false
        END,
        CASE
          WHEN target_role = 'admin' THEN true
          WHEN target_role IN ('adult', 'child', 'guest') THEN true
          ELSE false
        END
      ),
      (
        'documents',
        CASE WHEN target_role = 'admin' THEN true ELSE false END,
        CASE WHEN target_role = 'admin' THEN true ELSE false END
      )
  ) AS defaults(module_name, can_view, can_edit)
  ON CONFLICT (member_id, module) DO UPDATE
  SET
    family_id = EXCLUDED.family_id,
    can_view = EXCLUDED.can_view,
    can_edit = EXCLUDED.can_edit;
$$;

DO $$
DECLARE
  fm_row RECORD;
BEGIN
  FOR fm_row IN
    SELECT id, family_id, role
    FROM public.family_members
  LOOP
    PERFORM public.seed_member_permissions_for_role(
      fm_row.family_id,
      fm_row.id,
      fm_row.role
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_member_permissions_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_member_permissions_for_role(
    NEW.family_id,
    NEW.id,
    NEW.role
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seed_member_permissions_trigger ON public.family_members;

CREATE TRIGGER seed_member_permissions_trigger
AFTER INSERT ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.seed_member_permissions_trigger_fn();
