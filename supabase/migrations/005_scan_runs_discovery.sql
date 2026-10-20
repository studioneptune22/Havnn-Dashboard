-- =============================================================================
--  HAVNN — Migration 005 · Passages multiples et concurrents détectés
-- =============================================================================
--  À exécuter dans Supabase > SQL Editor, après la migration 004.
--  Idempotent : peut être relancé sans risque.
--
--   • prompts_monitoring.mention_runs : passages où le client est cité / passages,
--     par moteur (ex. {"chatgpt": [2, 3], "gemini": [0, 3]})
--   • tracked_brands.auto_added : concurrent ajouté automatiquement par le robot
--   • tracked_brands.ignored    : concurrent retiré à la main, jamais rajouté
-- =============================================================================

alter table public.prompts_monitoring
  add column if not exists mention_runs jsonb not null default '{}'::jsonb;

alter table public.tracked_brands add column if not exists auto_added boolean not null default false;
alter table public.tracked_brands add column if not exists ignored boolean not null default false;

-- La vue doit être recréée pour exposer la nouvelle colonne.
create or replace view public.prompts_latest
with (security_invoker = true) as
select distinct on (company_id, prompt_text) *
from public.prompts_monitoring
order by company_id, prompt_text, scanned_at desc;
