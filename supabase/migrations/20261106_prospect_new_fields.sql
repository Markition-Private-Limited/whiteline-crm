-- =============================================================
-- MARKITION CRM — Prospect New Fields + Presets
-- 2026-11-06
-- Adds: lead_gen_user_id, follow_up_date, follow_up_time,
--       contact_phone, contact_email, contact_role,
--       latest_interaction, next_action, image_url
-- Creates: prospect_presets (quick-fill templates)
-- =============================================================

BEGIN;

-- ── 1. New columns on prospects ───────────────────────────────────────────────

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS lead_gen_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_date    date,
  ADD COLUMN IF NOT EXISTS follow_up_time    time,
  ADD COLUMN IF NOT EXISTS contact_phone     text,
  ADD COLUMN IF NOT EXISTS contact_email     text,
  ADD COLUMN IF NOT EXISTS contact_role      text,
  ADD COLUMN IF NOT EXISTS latest_interaction text,
  ADD COLUMN IF NOT EXISTS next_action        text,
  ADD COLUMN IF NOT EXISTS image_url          text;

CREATE INDEX IF NOT EXISTS prospects_lead_gen_user_id_idx ON public.prospects(lead_gen_user_id);
CREATE INDEX IF NOT EXISTS prospects_follow_up_date_idx   ON public.prospects(follow_up_date)
  WHERE follow_up_date IS NOT NULL;

-- ── 2. prospect_presets (quick-fill templates) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.prospect_presets (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL UNIQUE,
  service_segment text,
  default_stage   text,
  display_order   int         NOT NULL DEFAULT 0,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY pp_service_role ON public.prospect_presets
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY pp_admin_write ON public.prospect_presets
  FOR ALL TO authenticated
  USING (public.my_app_role() IN ('SuperAdministrator', 'Administrator'))
  WITH CHECK (public.my_app_role() IN ('SuperAdministrator', 'Administrator'));

CREATE POLICY pp_all_read ON public.prospect_presets
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_presets TO service_role;
GRANT SELECT ON public.prospect_presets TO authenticated;

-- Seed default presets
INSERT INTO public.prospect_presets (name, service_segment, default_stage, display_order) VALUES
  ('Corporate Fleet Client',   'Fleet Management',     'New Lead',          1),
  ('Hospitality & Hotel',      'Hospitality Services', 'New Lead',          2),
  ('Government Entity',        'Government Services',  'Initial Discussion', 3),
  ('SME Client',               'SME Solutions',        'New Lead',          4),
  ('Retail Chain',             'Retail Services',      'New Lead',          5)
ON CONFLICT (name) DO NOTHING;

COMMIT;
