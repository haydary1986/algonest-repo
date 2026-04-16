-- Task 42 + FIX-06 (P0) — Auto-link auth.users to researchers row
--
-- Two heuristics, in order:
--   1. employee_id from raw_user_meta_data (most reliable)
--   2. username == part-before-@ of the email (fallback)
--
-- If neither matches, an entry is written to pending_profile_claims for an
-- admin to resolve (FIX-15 task 41b will surface this in the admin UI).
--
-- Trigger fires AFTER INSERT so the row is committed before we try to
-- mutate other tables.

-- pending_profile_claims (FIX-06 + FIX-15) -----------------------------
CREATE TABLE IF NOT EXISTS public.pending_profile_claims (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email                       text NOT NULL,
  attempted_at                timestamptz NOT NULL DEFAULT now(),
  resolved_at                 timestamptz,
  resolved_by                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_to_researcher_id   uuid REFERENCES public.researchers(id) ON DELETE SET NULL,
  CONSTRAINT pending_profile_claims_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_profile_claims_unresolved
  ON public.pending_profile_claims (attempted_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.pending_profile_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "self_read"  ON public.pending_profile_claims;
DROP POLICY IF EXISTS "admin_all"  ON public.pending_profile_claims;

-- A user can see only their own pending claim (used by /claim-profile UX).
CREATE POLICY "self_read"
  ON public.pending_profile_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins manage everything.
CREATE POLICY "admin_all"
  ON public.pending_profile_claims FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL                  ON public.pending_profile_claims FROM anon;
GRANT SELECT, UPDATE        ON public.pending_profile_claims TO authenticated;

-- Trigger function ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.link_user_to_researcher_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_researcher_id uuid;
  v_email_local   text;
BEGIN
  v_email_local := lower(split_part(NEW.email, '@', 1));

  -- (1) employee_id supplied at signup wins.
  IF NEW.raw_user_meta_data ? 'employee_id'
     AND NEW.raw_user_meta_data->>'employee_id' <> '' THEN
    UPDATE public.researchers
       SET user_id = NEW.id, updated_at = now()
     WHERE employee_id = NEW.raw_user_meta_data->>'employee_id'
       AND user_id IS NULL
    RETURNING id INTO v_researcher_id;
  END IF;

  -- (2) username matches email local part (case-insensitive).
  IF v_researcher_id IS NULL THEN
    UPDATE public.researchers
       SET user_id = NEW.id, updated_at = now()
     WHERE lower(username) = v_email_local
       AND user_id IS NULL
    RETURNING id INTO v_researcher_id;
  END IF;

  -- (3) Park unmatched users for admin review.
  IF v_researcher_id IS NULL THEN
    INSERT INTO public.pending_profile_claims (user_id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_user_to_researcher_trigger ON auth.users;

CREATE TRIGGER link_user_to_researcher_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_user_to_researcher_on_signup();
