-- =============================================================
-- MARKITION CRM — Add Lead Generation role
-- 2026-11-06
--
-- Adds "Lead Generation" as the 6th BRD role.
-- Permissions are intentionally minimal (Viewer-equivalent at the
-- API layer; the prospect_visible_to_me RLS function's ELSE FALSE
-- catch-all already blocks direct DB access for unrecognised roles).
-- =============================================================

BEGIN;

INSERT INTO public.app_roles (id, name, description) VALUES
  ('a0000001-0000-0000-0000-000000000006', 'Lead Generation',
    'Sources leads. Can log in and be selected as the Lead Generation Person on a prospect. No prospect view/edit/delete access until explicitly granted.')
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description;

COMMIT;
