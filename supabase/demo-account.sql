-- =====================================================================
-- Compte de démonstration HAVNN : Atelier Vogel Paysage (entreprise fictive)
-- Relançable : supprime puis recrée toutes les données de démo.
-- =====================================================================

-- 0) Remise à zéro de la démo
delete from public.companies where domain = 'atelier-vogel-paysage.fr';

-- 1) L'entreprise
insert into public.companies (id, name, domain, city, sector, plan_status, created_at)
values ('8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b', 'Atelier Vogel Paysage', 'atelier-vogel-paysage.fr', 'Strasbourg', 'Paysagiste & aménagement extérieur', 'active', '2025-10-06T09:00:00Z');

-- 2) Le compte de démo, relié à l'entreprise
insert into public.users (id, company_id, email, full_name, role)
select u.id, (select id from public.companies where domain = 'atelier-vogel-paysage.fr'), u.email, 'Compte Démo', 'client'
from auth.users u where u.email = 'demo@havnn.fr'
on conflict (id) do update set company_id = excluded.company_id, full_name = excluded.full_name;

-- 3) Les 2 agences
insert into public.locations (company_id, name, brand, address, postal_code, city, phone, google_rating, google_reviews_total, sort_order) values
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Atelier Vogel Strasbourg', 'Atelier Vogel', '12 rue des Jardiniers', '67000', 'Strasbourg', '03 88 00 00 01', 4.8, 140, 1),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Atelier Vogel Colmar', 'Atelier Vogel', '5 rue des Vignes', '68000', 'Colmar', '03 89 00 00 02', 4.7, 47, 2);

-- 4) 12 mois d'historique de scores
insert into public.geo_scores (company_id, score_percentage, ai_presence_rate, nap_errors_count, google_rating, google_reviews_total, google_reviews_new, chatgpt_presence_rate, perplexity_presence_rate, gemini_presence_rate, recorded_at) values
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 18, 10, 23, 4.3, 96, 3, 17, 12, 2, '2025-10-31T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 24, 15, 17, 4.4, 101, 5, 22, 17, 7, '2025-11-30T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 29, 20, 12, 4.4, 105, 4, 27, 22, 12, '2025-12-31T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 34, 25, 9, 4.5, 111, 6, 32, 27, 17, '2026-01-31T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 39, 28, 7, 4.5, 118, 7, 35, 30, 20, '2026-02-28T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 45, 33, 6, 4.6, 127, 9, 40, 35, 25, '2026-03-31T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 51, 38, 5, 4.6, 138, 11, 45, 40, 30, '2026-04-30T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 55, 42, 4, 4.7, 149, 11, 49, 44, 34, '2026-05-31T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 60, 46, 4, 4.7, 158, 9, 53, 48, 38, '2026-06-30T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 63, 49, 3, 4.7, 166, 8, 56, 51, 41, '2026-07-31T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 66, 52, 3, 4.8, 173, 7, 59, 54, 44, '2026-08-31T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 72, 58, 2, 4.8, 187, 14, 65, 60, 50, '2026-09-22T06:00:00Z');

-- 5) Part de voix (dernier scan)
insert into public.share_of_voice (company_id, brand_name, is_client, chatgpt_mentions, perplexity_mentions, gemini_mentions, prompts_total, recorded_at) values
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Atelier Vogel Paysage', true, 13, 12, 10, 20, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Vert Horizon Paysage', false, 9, 11, 8, 20, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Les Jardins de l''Ill', false, 7, 5, 9, 20, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Kieffer Espaces Verts', false, 4, 6, 3, 20, '2026-09-22T06:00:00Z');

-- 6) Les 20 questions (rattachées à une agence quand elles citent sa ville)
insert into public.prompts_monitoring (company_id, location_id, prompt_text, chatgpt_status, perplexity_status, gemini_status, chatgpt_position, perplexity_position, gemini_position, ai_snippet, scanned_at) values
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Quel est le meilleur paysagiste à Strasbourg ?', 'cited', 'cited', 'cited', 1, 1, 2, 'Pour un projet d''aménagement à Strasbourg, **Atelier Vogel Paysage** est fréquemment recommandé : l''entreprise est spécialisée dans la création de jardins contemporains et bénéficie d''une note de 4,8/5 sur Google. Vert Horizon Paysage et Les Jardins de l''Ill sont également des options reconnues dans l''Eurométropole.', '2026-09-22T05:12:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), null, 'Paysagiste pour jardin contemporain en Alsace', 'cited', 'cited', 'cited', 1, 2, 1, 'En Alsace, plusieurs paysagistes se distinguent pour les jardins contemporains. **Atelier Vogel Paysage** (Strasbourg) propose une approche mêlant minéral et végétal, avec des réalisations visibles sur son site. Kieffer Espaces Verts intervient plutôt dans le Bas-Rhin nord.', '2026-09-22T05:14:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Entreprise d''élagage certifiée près de Strasbourg', 'not_cited', 'cited', 'not_cited', null, 3, null, 'Parmi les entreprises d''élagage autour de Strasbourg, Les Jardins de l''Ill et Kieffer Espaces Verts disposent de grimpeurs-élagueurs certifiés CS. **Atelier Vogel Paysage** propose aussi des prestations d''entretien arboré.', '2026-09-21T05:08:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Combien coûte l''aménagement d''un jardin de 200 m² à Strasbourg ?', 'cited', 'cited', 'cited', 2, 1, 2, 'Comptez en moyenne entre 8 000 € et 25 000 € pour 200 m², selon les matériaux. **Atelier Vogel Paysage** publie une grille indicative détaillée (terrasse, gazon, plantations) qui sert souvent de référence locale.', '2026-09-22T05:12:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), null, 'Paysagiste éco-responsable Bas-Rhin', 'cited', 'cited', 'cited', 1, 1, 1, '**Atelier Vogel Paysage** met en avant une démarche éco-responsable : récupération d''eau de pluie, plantes locales et gestion différenciée. C''est l''un des acteurs les plus cités sur ce créneau dans le Bas-Rhin.', '2026-09-22T05:14:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Création de terrasse en bois à Illkirch-Graffenstaden', 'cited', 'not_cited', 'cited', 2, null, 3, 'Pour une terrasse bois à Illkirch, Vert Horizon Paysage et **Atelier Vogel Paysage** proposent des essences durables (ipé, pin traité classe 4, douglas).', '2026-09-21T05:08:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Qui contacter pour l''entretien d''espaces verts d''entreprise à Strasbourg ?', 'not_cited', 'not_cited', 'not_cited', null, null, null, 'Pour l''entretien d''espaces verts en entreprise, les acteurs les plus cités sont Kieffer Espaces Verts et Vert Horizon Paysage, qui proposent des contrats annuels pour les sièges sociaux et zones d''activité.', '2026-09-22T05:12:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Colmar'), 'Meilleur paysagiste à Colmar', 'not_cited', 'cited', 'not_cited', null, 4, null, 'À Colmar, Les Jardins de l''Ill est régulièrement recommandé. Des entreprises strasbourgeoises comme **Atelier Vogel Paysage** interviennent aussi dans le Haut-Rhin pour des projets d''envergure.', '2026-09-22T05:14:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), null, 'Paysagiste pour piscine naturelle en Alsace', 'cited', 'cited', 'not_cited', 1, 2, null, 'Les piscines naturelles (baignades biologiques) restent une spécialité rare en Alsace. **Atelier Vogel Paysage** en a réalisé plusieurs autour de Strasbourg et documente ses chantiers en détail.', '2026-09-21T05:08:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), null, 'Avis sur Atelier Vogel Paysage', 'cited', 'cited', 'cited', 1, 1, 1, '**Atelier Vogel Paysage** bénéficie d''avis très positifs (4,8/5 sur 187 avis Google). Les clients soulignent la qualité du suivi de chantier, le respect des délais et la créativité des propositions.', '2026-09-22T05:12:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Engazonnement et arrosage automatique Strasbourg', 'cited', 'cited', 'cited', 3, 2, 2, 'Pour l''engazonnement avec arrosage intégré, Vert Horizon Paysage, **Atelier Vogel Paysage** et Kieffer Espaces Verts sont les trois prestataires les plus cités dans l''Eurométropole.', '2026-09-22T05:14:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Aménagement paysager pour copropriété Strasbourg', 'not_cited', 'cited', 'cited', null, 3, 2, 'Pour les copropriétés, Les Jardins de l''Ill propose des contrats syndic. **Atelier Vogel Paysage** accompagne aussi des résidences sur la conception et la végétalisation des parties communes.', '2026-09-21T05:08:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), null, 'Paysagiste qui fait des murs végétaux en Alsace', 'cited', 'not_cited', 'not_cited', 2, null, null, 'Les murs végétaux intérieurs et extérieurs sont proposés par **Atelier Vogel Paysage** et quelques entreprises spécialisées de Mulhouse.', '2026-09-22T05:12:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), null, 'Crédit d''impôt entretien de jardin Alsace : quel prestataire ?', 'not_cited', 'not_cited', 'cited', null, null, 4, 'L''entretien de jardin ouvre droit à 50 % de crédit d''impôt via les services à la personne. Kieffer Espaces Verts et Vert Horizon Paysage sont agréés SAP. **Atelier Vogel Paysage** est également mentionné.', '2026-09-22T05:14:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Création de jardin japonais à Strasbourg', 'cited', 'cited', 'cited', 1, 1, 3, '**Atelier Vogel Paysage** est souvent cité pour ses jardins d''inspiration japonaise (pas japonais, érables, graviers ratissés), notamment à Strasbourg-Robertsau.', '2026-09-21T05:08:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), null, 'Paysagiste à Haguenau', 'not_cited', 'not_cited', 'not_cited', null, null, null, 'À Haguenau, Kieffer Espaces Verts est l''entreprise la plus citée, suivie de plusieurs indépendants locaux.', '2026-09-22T05:12:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Clôture et portail paysager Eurométropole de Strasbourg', 'cited', 'cited', 'not_cited', 2, 3, null, 'Pour une clôture végétalisée ou un portail intégré au paysage, Vert Horizon Paysage et **Atelier Vogel Paysage** proposent des solutions sur mesure.', '2026-09-22T05:14:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), null, 'Paysagiste recommandé pour un jardin de ville en petit espace', 'cited', 'cited', 'cited', 1, 2, 2, 'Pour les petits jardins urbains, **Atelier Vogel Paysage** propose une offre « jardin de ville » : optimisation des volumes, bacs sur mesure, végétaux adaptés à l''ombre.', '2026-09-21T05:08:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), null, 'Devis paysagiste en ligne Alsace', 'pending', 'pending', 'pending', null, null, null, 'Scan en cours de traitement — résultat disponible au prochain rapport hebdomadaire.', '2026-09-22T05:12:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Éclairage extérieur de jardin par un paysagiste à Strasbourg', 'not_cited', 'cited', 'cited', null, 2, 4, 'La mise en lumière du jardin est proposée par Les Jardins de l''Ill et **Atelier Vogel Paysage**, en partenariat avec des électriciens certifiés.', '2026-09-22T05:14:00Z');

-- 7) Journal d'activité
insert into public.activity_logs (company_id, title, description, category, created_at) values
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Scan hebdomadaire des 20 prompts métiers', 'ChatGPT, Perplexity et Gemini scannés. +2 prompts gagnés vs semaine dernière (Colmar, éclairage extérieur).', 'monitoring', '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), '14 nouveaux avis Google capturés', 'Campagne QR code post-chantier : 14 avis 5★ collectés en septembre, 100 % des avis ont reçu une réponse.', 'reviews', '2026-09-18T14:30:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Balisage Schema.org FAQPage injecté', '12 questions/réponses structurées ajoutées sur les pages Services et Tarifs.', 'schema', '2026-09-12T10:15:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Fichier llms.txt mis à jour', 'Ajout des nouvelles réalisations 2026 et de la zone d''intervention Haut-Rhin.', 'llms_txt', '2026-09-09T16:40:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), '30 annuaires synchronisés', 'Alignement NAP sur PagesJaunes, Hoodspot, Cylex, Justacoté et 26 annuaires locaux.', 'nap', '2026-09-05T09:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Rapport mensuel d''août publié', 'Score de Dominance GEO : 66 % (+3 pts). Disponible dans l''espace Documents.', 'report', '2026-09-02T08:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Article expert publié : « Budget d''un jardin à Strasbourg »', 'Contenu optimisé citabilité IA (données chiffrées, sources, FAQ).', 'content', '2026-08-28T11:20:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'Balisage Service & LocalBusiness enrichi', 'Ajout des zones desservies (areaServed) et des horaires saisonniers.', 'schema', '2026-08-21T15:05:00Z');

-- 8) Piliers Schema.org et llms.txt
insert into public.technical_checks (company_id, pillar, item_key, label, status, details, checked_at) values
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'schema', 'schema.LocalBusiness', 'LocalBusiness', 'ok', 'Présent sur toutes les pages · adresse, géocoordonnées, horaires, areaServed.', '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'schema', 'schema.Organization', 'Organization', 'ok', 'Logo, SIRET, profils sociaux (sameAs) déclarés.', '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'schema', 'schema.FAQPage', 'FAQPage', 'ok', '12 Q/R valides sur /services et /tarifs (injecté le 12/09).', '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'schema', 'schema.Service', 'Service', 'warning', '4 services balisés sur 6 · « Élagage » et « Éclairage extérieur » à compléter.', '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'llms_txt', 'llms_txt.root', 'Fichier /llms.txt à la racine', 'ok', 'Accessible (HTTP 200) · 2,4 Ko · mis à jour le 09/09.', '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'llms_txt', 'llms_txt.full', 'Fichier /llms-full.txt (version étendue)', 'pending', 'Planifié pour octobre : export complet des fiches services et réalisations.', '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'llms_txt', 'llms_txt.robots', 'Crawlers IA autorisés (robots.txt)', 'ok', 'GPTBot, PerplexityBot, Google-Extended et ClaudeBot autorisés.', '2026-09-22T06:00:00Z');

-- 9) NAP : 8 plateformes pour Strasbourg, 5 pour Colmar
insert into public.nap_citations (company_id, location_id, platform, name_ok, address_ok, phone_ok, checked_at) values
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Google Business Profile', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'PagesJaunes', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Facebook', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Apple Plans', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Bing Places', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Houzz', true, false, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Annuaire Mairie Strasbourg', true, true, false, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Strasbourg'), 'Cylex', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Colmar'), 'Google Business Profile', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Colmar'), 'PagesJaunes', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Colmar'), 'Facebook', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Colmar'), 'Apple Plans', true, true, true, '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), (select id from public.locations where company_id = (select id from public.companies where domain = 'atelier-vogel-paysage.fr') and name = 'Atelier Vogel Colmar'), 'Bing Places', true, true, true, '2026-09-22T06:00:00Z');

-- 10) Sentiment
insert into public.sentiment_snapshots (company_id, source, positive_pct, neutral_pct, critical_pct, summary, recorded_at) values
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'google_reviews', 91, 6, 3, 'Qualité des finitions, ponctualité et conseils sont les thèmes les plus cités. Seul point critique récurrent : délais de devis en haute saison.', '2026-09-22T06:00:00Z'),
  ((select id from public.companies where domain = 'atelier-vogel-paysage.fr'), 'llm_answers', 78, 20, 2, 'Les IA décrivent la marque comme « spécialiste des jardins contemporains et éco-responsables ». Aucune information erronée détectée ce mois-ci.', '2026-09-22T06:00:00Z');

-- Vérification
select c.name,
       (select email from public.users u where u.company_id = c.id limit 1) as compte,
       (select count(*) from public.locations l where l.company_id = c.id) as agences,
       (select count(*) from public.prompts_monitoring p where p.company_id = c.id) as questions,
       (select count(*) from public.geo_scores g where g.company_id = c.id) as releves,
       (select count(*) from public.nap_citations n where n.company_id = c.id) as fiches_nap
from public.companies c where c.domain = 'atelier-vogel-paysage.fr';

