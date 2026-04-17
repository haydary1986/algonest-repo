-- FIX-28 — sync_state table for resumable provider sync jobs.
CREATE TABLE IF NOT EXISTS public.sync_state (
  provider         text PRIMARY KEY,
  status           text NOT NULL DEFAULT 'idle',
  started_at       timestamptz,
  last_processed_id uuid,
  resumed_after    text,
  error            text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.sync_state (provider, status) VALUES
  ('scopus',   'idle'),
  ('wos',      'idle'),
  ('openalex', 'idle'),
  ('scholar',  'idle')
ON CONFLICT (provider) DO NOTHING;

ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_only" ON public.sync_state;
CREATE POLICY "admin_only" ON public.sync_state FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
