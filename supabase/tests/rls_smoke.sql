-- Task 35 — RLS smoke test
--
-- Run AFTER applying every migration in supabase/migrations/. This script
-- impersonates each role and asserts that RLS behaves as designed.
--
-- Usage:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_smoke.sql
--
-- Output is verbose; the script aborts (non-zero exit) on the first
-- assertion failure thanks to RAISE EXCEPTION + ON_ERROR_STOP.
--
-- Requires: at least one row in public.researchers with is_public=true and
-- another with is_public=false to make the visibility checks meaningful.

\set VERBOSITY terse
\set ON_ERROR_STOP on
\set SHOW_CONTEXT errors

BEGIN;

-- Reusable assertion helpers.
CREATE OR REPLACE FUNCTION pg_temp.assert_eq(actual integer, expected integer, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF actual <> expected THEN
    RAISE EXCEPTION '[%] expected %, got %', label, expected, actual;
  END IF;
  RAISE NOTICE '[OK] %: %', label, actual;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.assert_raises(stmt text, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE stmt;
  RAISE EXCEPTION '[%] expected error, statement succeeded', label;
EXCEPTION WHEN insufficient_privilege OR check_violation OR unique_violation THEN
  RAISE NOTICE '[OK] % raised %', label, SQLERRM;
END;
$$;

-- ---------------------------------------------------------------------------
-- Section 1 — anon role (signed-out user)
-- ---------------------------------------------------------------------------
SET LOCAL ROLE anon;

-- 1.1: cannot SELECT directly from researchers
SELECT pg_temp.assert_raises(
  'SELECT id FROM public.researchers LIMIT 1',
  'anon SELECT public.researchers must fail'
);

-- 1.2: CAN SELECT from researchers_public (only public rows)
SELECT pg_temp.assert_eq(
  (SELECT count(*)::int FROM public.researchers_public WHERE id IS NULL),
  0,
  'anon SELECT researchers_public returns no NULL ids'
);

-- 1.3: every row from researchers_public must be is_public OR force_show.
--      We can't see is_public from the view; instead verify the projection
--      hides forbidden columns by checking a known absent column reference.
DO $$ BEGIN
  PERFORM 1
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'researchers_public'
    AND column_name IN ('employee_id', 'user_id', 'birthdate',
                        'private_email', 'private_phone',
                        'private_office_location', 'private_office_hours',
                        'private_mailing_address');
  IF FOUND THEN
    RAISE EXCEPTION '[BAD] researchers_public exposes a private column';
  END IF;
  RAISE NOTICE '[OK] researchers_public hides employee_id / user_id / private_*';
END $$;

-- 1.4: writes are blocked
SELECT pg_temp.assert_raises(
  'INSERT INTO public.researchers (username, full_name_en, full_name_ar) VALUES (''anon-attack'', ''x'', ''x'')',
  'anon INSERT public.researchers must fail'
);
SELECT pg_temp.assert_raises(
  'UPDATE public.researchers SET full_name_en = ''hax'' WHERE true',
  'anon UPDATE public.researchers must fail'
);
SELECT pg_temp.assert_raises(
  'DELETE FROM public.researchers WHERE true',
  'anon DELETE public.researchers must fail'
);

-- 1.5: get_researchers_page works
DO $$ DECLARE r jsonb;
BEGIN
  SELECT public.get_researchers_page() INTO r;
  IF r->'data' IS NULL THEN
    RAISE EXCEPTION '[BAD] get_researchers_page returned no data key';
  END IF;
  RAISE NOTICE '[OK] anon get_researchers_page returned % rows',
    jsonb_array_length(r->'data');
END $$;

-- 1.6: is_admin() must be FALSE (and callable)
DO $$ BEGIN
  IF public.is_admin() THEN
    RAISE EXCEPTION '[BAD] anon is_admin() returned true';
  END IF;
  RAISE NOTICE '[OK] anon is_admin() = false';
END $$;

-- 1.7: admins / audit_log / app_settings
SELECT pg_temp.assert_raises(
  'SELECT id FROM public.admins LIMIT 1',
  'anon SELECT public.admins must fail'
);
SELECT pg_temp.assert_raises(
  'SELECT id FROM public.audit_log LIMIT 1',
  'anon SELECT public.audit_log must fail'
);
-- app_settings is intentionally readable by anon; assert no error.
DO $$ DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.app_settings;
  RAISE NOTICE '[OK] anon SELECT app_settings = % rows', n;
END $$;

RESET ROLE;

-- ---------------------------------------------------------------------------
-- Section 2 — authenticated role (signed-in researcher, not admin)
-- ---------------------------------------------------------------------------
-- We can't easily fake auth.uid() in a smoke test without setting up a JWT.
-- These checks therefore only verify privileges (GRANTs); per-row
-- enforcement is exercised by the app's E2E tests (task 166).

SET LOCAL ROLE authenticated;

-- 2.1: SELECT on researchers is allowed at the GRANT level (rows still
-- filtered by RLS to user's own row + public).
DO $$ DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.researchers;
  RAISE NOTICE '[OK] authenticated SELECT public.researchers = % rows (RLS filtered)', n;
END $$;

-- 2.2: is_admin() is callable
DO $$ DECLARE b boolean;
BEGIN
  SELECT public.is_admin() INTO b;
  RAISE NOTICE '[OK] authenticated is_admin() = %', b;
END $$;

RESET ROLE;

ROLLBACK;

\echo
\echo '======================================================================'
\echo '  RLS smoke test passed.'
\echo '======================================================================'
