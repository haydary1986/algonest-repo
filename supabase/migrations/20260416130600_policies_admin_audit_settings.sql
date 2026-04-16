-- Policies for admins / audit_log / app_settings.
-- Admin-only on writes; sensible reads on settings; INSERT-only audit log.

-- ---------------------------------------------------------------------------
-- admins — admins can manage themselves; nobody else sees this table.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_select" ON public.admins;
DROP POLICY IF EXISTS "admin_insert" ON public.admins;
DROP POLICY IF EXISTS "admin_update" ON public.admins;
DROP POLICY IF EXISTS "admin_delete" ON public.admins;
DROP POLICY IF EXISTS "self_select"  ON public.admins;

-- A user can always check whether THEIR OWN row exists (used by client UI to
-- decide whether to render the admin nav). This does not leak other admins.
CREATE POLICY "self_select"
  ON public.admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admin_select"
  ON public.admins FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_insert"
  ON public.admins FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update"
  ON public.admins FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete"
  ON public.admins FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- app_settings — public reads (settings drive UI); admin-only writes.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "settings_public_read" ON public.app_settings;
DROP POLICY IF EXISTS "admin_insert"         ON public.app_settings;
DROP POLICY IF EXISTS "admin_update"         ON public.app_settings;
DROP POLICY IF EXISTS "admin_delete"         ON public.app_settings;

GRANT SELECT ON public.app_settings TO anon;

CREATE POLICY "settings_public_read"
  ON public.app_settings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "admin_insert"
  ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update"
  ON public.app_settings FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete"
  ON public.app_settings FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_log — append-only.
--   * authenticated may INSERT rows attributed to themselves (triggers do
--     this with auth.uid()); they cannot SELECT anyone's history including
--     their own.
--   * admins may SELECT everything; nobody UPDATE / DELETE (immutable).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "self_insert"  ON public.audit_log;
DROP POLICY IF EXISTS "admin_select" ON public.audit_log;

CREATE POLICY "self_insert"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_user_id IS NULL OR actor_user_id = auth.uid());

CREATE POLICY "admin_select"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_admin());
