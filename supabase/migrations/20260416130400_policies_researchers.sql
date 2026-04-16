-- Tasks 29 + FIX-03 (P0) — Researcher policies, separated per op with WITH CHECK
--
-- Why separated FOR SELECT/INSERT/UPDATE/DELETE instead of FOR ALL:
-- the spec's `FOR ALL ... USING (...)` lets admin INSERT/UPDATE rows they
-- cannot SEE — silent privilege escalation. Splitting policies + adding
-- WITH CHECK to every write op closes that hole.
--
-- Notice: there's deliberately NO public_select policy for anon — public
-- access goes through `researchers_public` view (security_invoker, see
-- 20260416130300_views.sql), which respects RLS for the *anon* role and
-- finds zero rows there because no policy grants anon SELECT here.

-- Owner policies --------------------------------------------------------
DROP POLICY IF EXISTS "researcher_select_own" ON public.researchers;
DROP POLICY IF EXISTS "researcher_update_own" ON public.researchers;

CREATE POLICY "researcher_select_own"
  ON public.researchers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "researcher_update_own"
  ON public.researchers FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin policies (one per op) ------------------------------------------
DROP POLICY IF EXISTS "admin_select_all" ON public.researchers;
DROP POLICY IF EXISTS "admin_insert_all" ON public.researchers;
DROP POLICY IF EXISTS "admin_update_all" ON public.researchers;
DROP POLICY IF EXISTS "admin_delete_all" ON public.researchers;

CREATE POLICY "admin_select_all"
  ON public.researchers FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_insert_all"
  ON public.researchers FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_all"
  ON public.researchers FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_all"
  ON public.researchers FOR DELETE TO authenticated
  USING (public.is_admin());
