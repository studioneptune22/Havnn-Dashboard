-- =============================================================================
--  HAVNN — Migration 002 · Catégorie de journal « Référencement »
-- =============================================================================
--  À exécuter dans Supabase > SQL Editor. Idempotent.
--  Pour les actions SEO techniques : indexation, Search Console, sitemap…
-- =============================================================================

alter type public.activity_category add value if not exists 'seo';
