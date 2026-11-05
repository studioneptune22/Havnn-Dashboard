-- =============================================================================
--  HAVNN — Migration 001 · Établissements (clients multi-sites)
-- =============================================================================
--  À exécuter dans Supabase > SQL Editor, après `schema.sql`.
--  Idempotent : peut être relancé sans risque.
--
--  Un client peut déclarer plusieurs établissements (centres, agences…).
--  Sans établissement déclaré, le portail fonctionne comme avant (mono-site).
--   • locations           : un établissement, avec sa propre note Google
--   • nap_citations       : une fiche NAP par (établissement, plateforme)
--   • prompts_monitoring  : une question peut être rattachée à un établissement
-- =============================================================================

create table if not exists public.locations (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies (id) on delete cascade,
  name                 text not null,          -- ex : "Autovision Illkirch"
  brand                text,                   -- enseigne, ex : "Autovision"
  address              text,
  postal_code          text,
  city                 text,
  phone                text,
  google_rating        numeric(2,1) check (google_rating between 0 and 5),
  google_reviews_total integer check (google_reviews_total >= 0),
  google_maps_url      text,
  sort_order           smallint not null default 0,
  created_at           timestamptz not null default now(),
  unique (company_id, name),
  -- Cible des clés étrangères composites : un rattachement ne peut pas
  -- pointer vers l'établissement d'une autre entreprise.
  unique (id, company_id)
);
create index if not exists locations_company_idx on public.locations (company_id, sort_order);

-- NAP : une fiche par établissement et par plateforme -------------------------
alter table public.nap_citations add column if not exists location_id uuid;

do $$ begin
  alter table public.nap_citations
    add constraint nap_citations_location_fk
    foreign key (location_id, company_id) references public.locations (id, company_id) on delete cascade;
exception when duplicate_object then null; end $$;

alter table public.nap_citations drop constraint if exists nap_citations_company_id_platform_key;
do $$ begin
  -- NULLS NOT DISTINCT : une seule fiche "groupe" (location_id NULL) par plateforme.
  alter table public.nap_citations
    add constraint nap_citations_company_location_platform_key
    unique nulls not distinct (company_id, location_id, platform);
exception when duplicate_object or duplicate_table then null; end $$;

-- Questions : rattachement optionnel à un établissement ----------------------
alter table public.prompts_monitoring add column if not exists location_id uuid;

do $$ begin
  alter table public.prompts_monitoring
    add constraint prompts_monitoring_location_fk
    foreign key (location_id, company_id) references public.locations (id, company_id)
    on delete set null (location_id);
exception when duplicate_object then null; end $$;

-- La vue doit être recréée pour exposer la nouvelle colonne.
create or replace view public.prompts_latest
with (security_invoker = true) as
select distinct on (company_id, prompt_text) *
from public.prompts_monitoring
order by company_id, prompt_text, scanned_at desc;

-- RLS : lecture seule, limitée à l'entreprise de l'utilisateur ---------------
alter table public.locations enable row level security;
drop policy if exists "locations_select_own_company" on public.locations;
create policy "locations_select_own_company" on public.locations
  for select to authenticated
  using (company_id = public.current_company_id() or public.is_havnn_admin());
