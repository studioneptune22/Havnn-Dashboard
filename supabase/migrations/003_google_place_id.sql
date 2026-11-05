-- =============================================================================
--  HAVNN — Migration 003 · Identifiant de fiche Google (mise à jour des avis)
-- =============================================================================
--  À exécuter dans Supabase > SQL Editor. Idempotent.
--
--  Le « Place ID » identifie une fiche Google Maps (ex : ChIJ…). Une fois
--  renseigné, la note et le nombre d'avis sont relevés chaque jour par la
--  route /api/cron/google-reviews (Vercel Cron) :
--   • companies.google_place_id : client mono-site → met à jour le dernier geo_scores
--   • locations.google_place_id : client multi-sites → met à jour l'établissement
-- =============================================================================

alter table public.companies add column if not exists google_place_id text;
alter table public.locations add column if not exists google_place_id text;
