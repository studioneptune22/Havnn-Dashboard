-- =============================================================================
--  HAVNN — Client Portal · Schéma Supabase (PostgreSQL)
-- =============================================================================
--  À exécuter dans Supabase > SQL Editor (ou `supabase db push`).
--  Le script est idempotent autant que possible (IF NOT EXISTS / OR REPLACE).
--
--  Principes :
--   • Chaque ligne métier est rattachée à une `company_id`.
--   • Les clients (rôle `client`) ne voient QUE les données de leur entreprise
--     grâce au Row Level Security (RLS).
--   • Les consultants HAVNN (rôle `havnn_admin`) voient toutes les entreprises.
--   • Les écritures proviennent des webhooks Make.com / N8N via la clé
--     `service_role` (qui contourne le RLS) → aucune policy INSERT/UPDATE côté client.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Types énumérés
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('client', 'havnn_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Statut d'une marque sur un moteur IA pour un prompt donné
  create type public.ai_citation_status as enum ('cited', 'not_cited', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_category as enum
    ('schema', 'nap', 'content', 'reviews', 'llms_txt', 'report', 'monitoring', 'seo', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_category as enum
    ('monthly_report', 'roadmap', 'contract', 'csv_export', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.check_status as enum ('ok', 'warning', 'error', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.geo_pillar as enum ('schema', 'llms_txt', 'nap', 'sentiment');
exception when duplicate_object then null; end $$;

-- =============================================================================
--  TABLES PRINCIPALES (cahier des charges)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- companies : les clients du Cabinet HAVNN
-- -----------------------------------------------------------------------------
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  domain      text unique,
  city        text,
  sector      text,
  -- Statut de la mission, affiché dans le header ("Optimisation GEO Active")
  plan_status text not null default 'active' check (plan_status in ('onboarding', 'active', 'paused')),
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- users : profil applicatif, 1-1 avec auth.users
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  company_id  uuid references public.companies (id) on delete set null,
  email       text not null unique,
  full_name   text,
  role        public.user_role not null default 'client',
  created_at  timestamptz not null default now()
);
create index if not exists users_company_idx on public.users (company_id);

-- -----------------------------------------------------------------------------
-- geo_scores : snapshot hebdomadaire des KPIs héros
-- -----------------------------------------------------------------------------
create table if not exists public.geo_scores (
  id                     uuid primary key default gen_random_uuid(),
  company_id             uuid not null references public.companies (id) on delete cascade,
  score_percentage       numeric(5,2) not null check (score_percentage between 0 and 100),
  ai_presence_rate       numeric(5,2) not null check (ai_presence_rate between 0 and 100),
  nap_errors_count       integer not null default 0 check (nap_errors_count >= 0),
  -- Extensions utiles au cockpit (Note Google & fiche GMB, détail par moteur)
  google_rating          numeric(2,1) check (google_rating between 0 and 5),
  google_reviews_total   integer check (google_reviews_total >= 0),
  google_reviews_new     integer check (google_reviews_new >= 0),
  chatgpt_presence_rate  numeric(5,2),
  perplexity_presence_rate numeric(5,2),
  gemini_presence_rate   numeric(5,2),
  recorded_at            timestamptz not null default now()
);
create index if not exists geo_scores_company_date_idx on public.geo_scores (company_id, recorded_at desc);

-- -----------------------------------------------------------------------------
-- prompts_monitoring : résultat d'un scan pour un prompt métier
--   → une ligne par (prompt, scan) : l'historique est conservé.
--   → la vue `prompts_latest` expose le dernier scan de chaque prompt.
-- -----------------------------------------------------------------------------
create table if not exists public.prompts_monitoring (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies (id) on delete cascade,
  prompt_text         text not null,
  chatgpt_status      public.ai_citation_status not null default 'pending',
  perplexity_status   public.ai_citation_status not null default 'pending',
  gemini_status       public.ai_citation_status not null default 'pending',
  -- Position de la marque dans la réponse, par moteur (1 = citée en premier)
  chatgpt_position    smallint check (chatgpt_position > 0),
  perplexity_position smallint check (perplexity_position > 0),
  gemini_position     smallint check (gemini_position > 0),
  -- Meilleure position tous moteurs confondus (least() ignore les NULL)
  position            smallint generated always as
                        (least(chatgpt_position, perplexity_position, gemini_position)) stored,
  -- Extrait principal de la réponse IA + extraits détaillés par moteur
  ai_snippet          text,
  ai_snippets         jsonb not null default '{}'::jsonb, -- {"chatgpt": "...", "perplexity": "...", "gemini": "..."}
  scanned_at          timestamptz not null default now()
);
create index if not exists prompts_company_prompt_date_idx
  on public.prompts_monitoring (company_id, prompt_text, scanned_at desc);

-- -----------------------------------------------------------------------------
-- activity_logs : journal des actions réalisées par HAVNN
-- -----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  title       text not null,
  description text,
  category    public.activity_category not null default 'other',
  created_at  timestamptz not null default now()
);
create index if not exists activity_company_date_idx on public.activity_logs (company_id, created_at desc);

-- -----------------------------------------------------------------------------
-- documents : rapports PDF & coffre-fort documentaire
--   `file_url` = chemin dans le bucket Storage privé `documents`
--   (ex : "<company_id>/rapports/2026-08.pdf") ou URL externe.
-- -----------------------------------------------------------------------------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  title       text not null,
  file_url    text not null,
  category    public.document_category not null default 'other',
  file_size   bigint,
  period      date, -- mois couvert par un rapport mensuel
  created_at  timestamptz not null default now()
);
create index if not exists documents_company_date_idx on public.documents (company_id, created_at desc);

-- =============================================================================
--  TABLES COMPLÉMENTAIRES (nécessaires aux vues Cockpit & Audit technique)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- share_of_voice : part de voix IA (marque cliente vs concurrents directs)
-- -----------------------------------------------------------------------------
create table if not exists public.share_of_voice (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies (id) on delete cascade,
  brand_name          text not null,
  is_client           boolean not null default false,
  chatgpt_mentions    smallint not null default 0 check (chatgpt_mentions >= 0),
  perplexity_mentions smallint not null default 0 check (perplexity_mentions >= 0),
  gemini_mentions     smallint not null default 0 check (gemini_mentions >= 0),
  prompts_total       smallint not null default 20 check (prompts_total > 0),
  recorded_at         timestamptz not null default now()
);
create index if not exists sov_company_date_idx on public.share_of_voice (company_id, recorded_at desc);

-- -----------------------------------------------------------------------------
-- technical_checks : checklist des 4 piliers GEO
--   pillar = schema | llms_txt | nap | sentiment
--   item_key = identifiant stable (ex : "schema.LocalBusiness", "llms_txt.root")
-- -----------------------------------------------------------------------------
create table if not exists public.technical_checks (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  pillar      public.geo_pillar not null,
  item_key    text not null,
  label       text not null,
  status      public.check_status not null default 'pending',
  details     text,
  checked_at  timestamptz not null default now(),
  unique (company_id, item_key)
);

-- -----------------------------------------------------------------------------
-- nap_citations : alignement Nom / Adresse / Téléphone par plateforme
-- -----------------------------------------------------------------------------
create table if not exists public.nap_citations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  platform    text not null,
  listing_url text,
  name_ok     boolean not null default false,
  address_ok  boolean not null default false,
  phone_ok    boolean not null default false,
  checked_at  timestamptz not null default now(),
  unique (company_id, platform)
);

-- -----------------------------------------------------------------------------
-- sentiment_snapshots : tonalité des avis clients & des réponses LLM (en %)
-- -----------------------------------------------------------------------------
create table if not exists public.sentiment_snapshots (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies (id) on delete cascade,
  source       text not null check (source in ('google_reviews', 'llm_answers')),
  positive_pct numeric(5,2) not null default 0,
  neutral_pct  numeric(5,2) not null default 0,
  critical_pct numeric(5,2) not null default 0,
  summary      text,
  recorded_at  timestamptz not null default now(),
  check (positive_pct + neutral_pct + critical_pct between 99 and 101)
);
create index if not exists sentiment_company_date_idx on public.sentiment_snapshots (company_id, source, recorded_at desc);

-- =============================================================================
--  VUES
-- =============================================================================

-- Dernier scan de chaque prompt (security_invoker → le RLS de la table s'applique)
create or replace view public.prompts_latest
with (security_invoker = true) as
select distinct on (company_id, prompt_text) *
from public.prompts_monitoring
order by company_id, prompt_text, scanned_at desc;

-- =============================================================================
--  ROW LEVEL SECURITY
-- =============================================================================

-- Fonctions utilitaires (SECURITY DEFINER pour éviter la récursion RLS sur users)
create or replace function public.current_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select company_id from public.users where id = auth.uid()
$$;

create or replace function public.is_havnn_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'havnn_admin')
$$;

revoke all on function public.current_company_id() from public;
revoke all on function public.is_havnn_admin() from public;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.is_havnn_admin() to authenticated;

-- companies ------------------------------------------------------------------
alter table public.companies enable row level security;
drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own" on public.companies
  for select to authenticated
  using (id = public.current_company_id() or public.is_havnn_admin());

-- users ----------------------------------------------------------------------
alter table public.users enable row level security;
drop policy if exists "users_select_self_or_company" on public.users;
create policy "users_select_self_or_company" on public.users
  for select to authenticated
  using (id = auth.uid() or company_id = public.current_company_id() or public.is_havnn_admin());

-- Pas de policy UPDATE : les profils sont gérés par HAVNN (service_role).

-- Tables métier : lecture seule, limitée à l'entreprise de l'utilisateur -------
do $$
declare
  t text;
begin
  foreach t in array array[
    'geo_scores', 'prompts_monitoring', 'activity_logs', 'documents',
    'share_of_voice', 'technical_checks', 'nap_citations', 'sentiment_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_select_own_company" on public.%I', t, t);
    execute format(
      'create policy "%s_select_own_company" on public.%I for select to authenticated
         using (company_id = public.current_company_id() or public.is_havnn_admin())',
      t, t
    );
  end loop;
end $$;

-- =============================================================================
--  STORAGE : bucket privé `documents`
--   Arborescence attendue : <company_id>/<dossier>/<fichier>
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents_read_own_company" on storage.objects;
create policy "documents_read_own_company" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = public.current_company_id()::text
      or public.is_havnn_admin()
    )
  );
