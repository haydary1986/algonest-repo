-- Fix 1: Allow authenticated users to see public researchers
-- The researchers_public view uses security_invoker=true, which means
-- RLS on the researchers table applies. Currently only owner and admin
-- policies exist, so authenticated users can't see OTHER users' public profiles.

DROP POLICY IF EXISTS "authenticated_select_public" ON public.researchers;

CREATE POLICY "authenticated_select_public"
  ON public.researchers FOR SELECT TO authenticated
  USING (
    is_public = true
    AND admin_visibility_override IS DISTINCT FROM 'force_hide'
  );

-- Also allow anon to see public researchers (needed for unauthenticated visitors)
DROP POLICY IF EXISTS "anon_select_public" ON public.researchers;

CREATE POLICY "anon_select_public"
  ON public.researchers FOR SELECT TO anon
  USING (
    is_public = true
    AND admin_visibility_override IS DISTINCT FROM 'force_hide'
  );

-- Fix 2: Auto-create researcher profile for new users instead of just pending_profile_claims
-- Replace the trigger function to create a profile when no match is found.

CREATE OR REPLACE FUNCTION public.link_user_to_researcher_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_researcher_id uuid;
  v_email_local   text;
  v_full_name     text;
BEGIN
  v_email_local := lower(split_part(NEW.email, '@', 1));
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    v_email_local
  );

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

  -- (3) Auto-create a researcher profile for the new user.
  IF v_researcher_id IS NULL THEN
    INSERT INTO public.researchers (
      user_id, username, full_name_en, full_name_ar,
      private_email, is_public
    ) VALUES (
      NEW.id,
      v_email_local,
      v_full_name,
      v_full_name,
      NEW.email,
      false
    )
    ON CONFLICT (username) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          updated_at = now()
      WHERE researchers.user_id IS NULL
    RETURNING id INTO v_researcher_id;

    -- Also keep a record in pending_profile_claims for admin awareness
    INSERT INTO public.pending_profile_claims (user_id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
