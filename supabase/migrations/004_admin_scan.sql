-- =============================================================================
--  HAVNN — Migration 004 · Vue admin & relevé automatique ChatGPT / Gemini
-- =============================================================================
--  À exécuter dans Supabase > SQL Editor, après les migrations 001 à 003.
--  Idempotent : peut être relancé sans risque.
--
--   • companies.auto_scan : le client est inclus dans le relevé automatique
--   • tracked_brands      : marque du client et concurrents suivis, avec leurs
--                           variantes de nom (« Ax'home » / « Axhome »)
--   • scan_runs           : historique des relevés automatiques (test ou réel)
--
--  Les écritures passent par le serveur (clé service_role) après vérification
--  du rôle havnn_admin : aucune policy INSERT/UPDATE côté navigateur.
-- =============================================================================

alter table public.companies add column if not exists auto_scan boolean not null default false;

-- -----------------------------------------------------------------------------
-- tracked_brands : marques reconnues dans les réponses des IA
-- -----------------------------------------------------------------------------
create table if not exists public.tracked_brands (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  name        text not null,                    -- nom affiché (part de voix)
  aliases     text[] not null default '{}',     -- variantes reconnues dans les réponses
  is_client   boolean not null default false,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now(),
  unique (company_id, name)
);
create index if not exists tracked_brands_company_idx on public.tracked_brands (company_id, sort_order);

-- Une seule marque « client » par entreprise.
create unique index if not exists tracked_brands_one_client_idx
  on public.tracked_brands (company_id) where is_client;

-- Reprise des marques du dernier relevé manuel (part de voix), sans écraser l'existant.
insert into public.tracked_brands (company_id, name, is_client, sort_order)
select s.company_id, s.brand_name, s.is_client,
       (row_number() over (partition by s.company_id
          order by s.is_client desc, s.chatgpt_mentions + s.gemini_mentions desc, s.brand_name))::smallint
from public.share_of_voice s
where s.recorded_at = (select max(recorded_at) from public.share_of_voice x where x.company_id = s.company_id)
on conflict (company_id, name) do nothing;

-- -----------------------------------------------------------------------------
-- scan_runs : un relevé automatique par client
--   mode = 'test' : résultats enregistrés ici seulement (calibrage, le Cockpit ne bouge pas)
--   mode = 'live' : résultats publiés dans le Cockpit du client
-- -----------------------------------------------------------------------------
create table if not exists public.scan_runs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  mode        text not null check (mode in ('test', 'live')),
  status      text not null check (status in ('ok', 'partial', 'error')),
  summary     jsonb not null default '{}'::jsonb,  -- score, taux, coût estimé…
  results     jsonb not null default '[]'::jsonb,  -- détail par question et par moteur
  error       text,
  created_at  timestamptz not null default now()
);
create index if not exists scan_runs_company_date_idx on public.scan_runs (company_id, created_at desc);

-- RLS : réservé à HAVNN (les clients ne voient ni les variantes ni les relevés de test)
alter table public.tracked_brands enable row level security;
drop policy if exists "tracked_brands_select_admin" on public.tracked_brands;
create policy "tracked_brands_select_admin" on public.tracked_brands
  for select to authenticated using (public.is_havnn_admin());

alter table public.scan_runs enable row level security;
drop policy if exists "scan_runs_select_admin" on public.scan_runs;
create policy "scan_runs_select_admin" on public.scan_runs
  for select to authenticated using (public.is_havnn_admin());
