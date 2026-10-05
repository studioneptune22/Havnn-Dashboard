-- =============================================================================
--  HAVNN — Données de démonstration (à exécuter APRÈS schema.sql)
--  Client fictif : Atelier Vogel Paysage (Strasbourg)
-- =============================================================================

insert into public.companies (id, name, domain, city, sector, plan_status, created_at) values
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Atelier Vogel Paysage', 'atelier-vogel-paysage.fr',
   'Strasbourg', 'Paysagiste & aménagement extérieur', 'active', '2025-10-06T09:00:00Z')
on conflict (id) do nothing;

-- Scores (6 derniers mois)
insert into public.geo_scores
  (company_id, score_percentage, ai_presence_rate, nap_errors_count, google_rating, google_reviews_total,
   google_reviews_new, chatgpt_presence_rate, perplexity_presence_rate, gemini_presence_rate, recorded_at)
values
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 45, 33, 6, 4.6, 127, 9, 40, 35, 25, '2026-03-31T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 51, 38, 5, 4.6, 138, 11, 45, 40, 30, '2026-04-30T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 55, 42, 4, 4.7, 149, 11, 49, 44, 34, '2026-05-31T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 60, 46, 4, 4.7, 158, 9, 53, 48, 38, '2026-06-30T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 63, 49, 3, 4.7, 166, 8, 56, 51, 41, '2026-07-31T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 66, 52, 3, 4.8, 173, 7, 59, 54, 44, '2026-08-31T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 72, 58, 2, 4.8, 187, 14, 65, 60, 50, '2026-09-22T06:00:00Z');

-- Part de voix IA
insert into public.share_of_voice
  (company_id, brand_name, is_client, chatgpt_mentions, perplexity_mentions, gemini_mentions, prompts_total, recorded_at)
values
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Atelier Vogel Paysage', true, 13, 12, 10, 20, '2026-09-22T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Vert Horizon Paysage', false, 9, 11, 8, 20, '2026-09-22T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Les Jardins de l''Ill', false, 7, 5, 9, 20, '2026-09-22T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Kieffer Espaces Verts', false, 4, 6, 3, 20, '2026-09-22T06:00:00Z');

-- Prompts métiers (extrait)
insert into public.prompts_monitoring
  (company_id, prompt_text, chatgpt_status, perplexity_status, gemini_status,
   chatgpt_position, perplexity_position, gemini_position, ai_snippet, scanned_at)
values
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Quel est le meilleur paysagiste à Strasbourg ?', 'cited', 'cited', 'cited', 1, 1, 2,
   'Pour un projet d''aménagement à Strasbourg, **Atelier Vogel Paysage** est fréquemment recommandé : jardins contemporains, note de 4,8/5 sur Google.', '2026-09-22T05:12:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Paysagiste éco-responsable Bas-Rhin', 'cited', 'cited', 'cited', 1, 1, 1,
   '**Atelier Vogel Paysage** met en avant une démarche éco-responsable : récupération d''eau de pluie, plantes locales.', '2026-09-22T05:14:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Entreprise d''élagage certifiée près de Strasbourg', 'not_cited', 'cited', 'not_cited', null, 3, null,
   'Les Jardins de l''Ill et Kieffer Espaces Verts disposent de grimpeurs-élagueurs certifiés. **Atelier Vogel Paysage** propose aussi l''entretien arboré.', '2026-09-21T05:08:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Paysagiste à Haguenau', 'not_cited', 'not_cited', 'not_cited', null, null, null,
   'À Haguenau, Kieffer Espaces Verts est l''entreprise la plus citée.', '2026-09-22T05:12:00Z');

-- Journal d'activité
insert into public.activity_logs (company_id, title, description, category, created_at) values
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Scan hebdomadaire des 20 prompts métiers', '+2 prompts gagnés vs semaine dernière.', 'monitoring', '2026-09-22T06:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', '14 nouveaux avis Google capturés', 'Campagne QR code post-chantier.', 'reviews', '2026-09-18T14:30:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Balisage Schema.org FAQPage injecté', '12 Q/R structurées sur Services et Tarifs.', 'schema', '2026-09-12T10:15:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', '30 annuaires synchronisés', 'Alignement NAP sur PagesJaunes, Cylex, Justacoté…', 'nap', '2026-09-05T09:00:00Z');

-- Audit technique
insert into public.technical_checks (company_id, pillar, item_key, label, status, details) values
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'schema', 'schema.LocalBusiness', 'LocalBusiness', 'ok', 'Présent sur toutes les pages.'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'schema', 'schema.Organization', 'Organization', 'ok', 'Logo, SIRET, sameAs déclarés.'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'schema', 'schema.FAQPage', 'FAQPage', 'ok', '12 Q/R valides.'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'schema', 'schema.Service', 'Service', 'warning', '4 services balisés sur 6.'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'llms_txt', 'llms_txt.root', 'Fichier /llms.txt à la racine', 'ok', 'HTTP 200 · 2,4 Ko.'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'llms_txt', 'llms_txt.robots', 'Crawlers IA autorisés (robots.txt)', 'ok', 'GPTBot, PerplexityBot, Google-Extended autorisés.')
on conflict (company_id, item_key) do nothing;

insert into public.nap_citations (company_id, platform, name_ok, address_ok, phone_ok) values
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Google Business Profile', true, true, true),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'PagesJaunes', true, true, true),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Facebook', true, true, true),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Houzz', true, false, true)
on conflict (company_id, location_id, platform) do nothing;

insert into public.sentiment_snapshots (company_id, source, positive_pct, neutral_pct, critical_pct, summary) values
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'google_reviews', 91, 6, 3, 'Qualité des finitions et ponctualité très citées.'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'llm_answers', 78, 20, 2, 'Décrite comme spécialiste des jardins contemporains.');

-- Documents (fichiers à déposer dans le bucket `documents` sous <company_id>/...)
insert into public.documents (company_id, title, file_url, category, file_size, period, created_at) values
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Rapport mensuel GEO — Août 2026',
   '8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b/rapports/2026-08.pdf', 'monthly_report', 2480000, '2026-08-01', '2026-09-02T08:00:00Z'),
  ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Feuille de route GEO initiale',
   '8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b/coffre/feuille-de-route.pdf', 'roadmap', 4120000, null, '2025-10-10T10:00:00Z');

-- -----------------------------------------------------------------------------
-- Rattacher un utilisateur : créez d'abord le compte dans Supabase > Authentication,
-- puis remplacez l'email ci-dessous :
-- -----------------------------------------------------------------------------
-- insert into public.users (id, company_id, email, full_name, role)
-- select id, '8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', email, 'Julien Vogel', 'client'
-- from auth.users where email = 'julien@atelier-vogel-paysage.fr';
