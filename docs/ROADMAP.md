# HAVNN — Feuille de route

_Dernière mise à jour : 9 octobre 2026_

## 🗺️ Plan de déploiement du Cockpit (octobre 2026 → été 2027)

Issu de l'étude de marché du 9 octobre 2026 (Profound, Peec AI, Otterly, Semrush, outils français Meteoria /
Qwairy / GetMint, Local Falcon, BrightLocal, Partoo, outil de l'Agence Onze). Environ 20 séances en 4 phases,
chacune fermée par un contrôle. Positionnement : le cockpit GEO **local**, en français, qui relie la visibilité
IA au NAP, aux avis et aux actions menées (journal).

### Phase 1 — Fondations (oct. – déc. 2026, ≈ 5 séances)
1. **Avis Google automatiques** (code en ligne, config de Jérôme) : migration 003, clé Places API (New) + alerte
   budget 5 €, `GOOGLE_PLACES_API_KEY` et `CRON_SECRET` dans Vercel, Place ID des 11 fiches, test via « Run ».
2. **Relevé automatique hebdomadaire ChatGPT + Gemini** (2 séances) : positions, score, part de voix,
   **aperçu de la citation** (extrait de réponse par question). **Code en ligne (9 oct.)**, testé sur réponses
   simulées ; reste la config de Jérôme (comptes, clés en secrets GitHub, variantes de noms) et le calibrage.
   - Comptes OpenAI et Google AI Studio + limites de dépense.
   - Concurrents et variantes de noms par client (ex. « Ax'home » / « Axhome », règle Autovision hors groupe).
   - Robot (GitHub Actions, chaque lundi) : ChatGPT (GPT-5.6 Terra + recherche web), Gemini (3.8 Flash +
     recherche Google), analyse des réponses (Flash Lite).
   - Calibrage 1 à 2 semaines en parallèle d'un relevé manuel.
3. ✅ **Vue admin** : passer d'un client à l'autre, créer un client et son accès portail, questions et concurrents
   sans SQL (migration 004 à exécuter).
4. ✅ **Ajout manuel au journal** depuis la vue admin, sans SQL.
5. **Rapport PDF archivé automatiquement** + brouillon Gmail au client (1 séance).
6. **app.havnn.fr** et vrai logo dans l'application (1/2 séance).
7. **Décision** : bouton « Générer un rapport » visible par les clients ou réservé à HAVNN.

Contrôle : relevé automatique = relevé manuel sur les clients existants.

### Phase 2 — Mesure fiable (janv. – févr. 2027, ≈ 6,5 séances)
1. **Plusieurs passages par question** (3 par semaine et par moteur), taux de mention, tendance en points (1 séance).
2. **Sources lues par les IA** enregistrées à chaque passage, **mention ou citation** (site du client dans les sources) (1,5 séance).
3. **Détection automatique des mentions et citations**, y compris des concurrents non listés (1/2 séance).
4. **Thèmes (tags) et zones par question** : filtrer « fenêtres », « Strasbourg Nord »… (1/2 séance).
5. **Veille des mentions sur le web** : annuaires, presse locale, forums (1 séance).
6. **Page « Testez votre visibilité IA »** pour les prospects (2 séances, détail plus bas).

Contrôle : chiffres stables d'une semaine à l'autre.

### Phase 3 — Relation client (mars – avr. 2027, ≈ 4 séances)
1. **Messagerie avec Jérôme / contacter le support** depuis le cockpit (1 séance).
2. **Champ « proposer une question »**, validée par Jérôme avant d'entrer dans le suivi (1/2 séance).
3. **Réponses aux avis Google rédigées par l'IA**, relues avant publication (1,5 séance). Publication directe =
   accès à l'API Google Business Profile (demande à Google) ; en attendant, copier-coller.
4. **Alertes par mail** : citation perdue, avis négatif, concurrent qui passe devant (1/2 séance).
5. **Récapitulatif mensuel automatique** par mail (1/2 séance).

Contrôle : les clients utilisent le cockpit (connexions, messages, questions proposées).

### Phase 4 — Avantage local (mai – juil. 2027, ≈ 5 séances)
1. **Page « Sources à travailler » reliée au NAP** : « ChatGPT lit PagesJaunes sur 6 questions et votre fiche
   a une mauvaise adresse → priorité » (1 séance).
2. **Audit automatique du site** : Schema.org, llms.txt, robots.txt, pages lisibles par les IA (1 séance),
   réutilise l'onglet « Analyse de contenu » de la page prospects.
3. **Questions posées commune par commune** : carte de visibilité locale, façon Local Falcon (1 séance).
4. **Moteurs supplémentaires** : Perplexity, Copilot, mode IA de Google, Mistral (1/4 séance par moteur).
5. **Export CSV** et **rapport PDF V2** : graphiques, synthèse, charte (1 séance).

**Écartés** : métriques SEO des sources et prix d'achat d'articles (Onze), volumes de recherche des prompts
(Profound), analyse des robots IA sur le site, marque blanche.

## 🚀 Détail — Page « Testez votre visibilité IA » (phase 2)

Page d'atterrissage publique pour les prospects (inspiration : https://www.geobuster.ai/) :
- formulaire (entreprise, ville, activité, site, email) ;
- mini-scan en direct : quelques questions générées pour l'activité et la ville, posées à ChatGPT et Gemini ;
- résultat partiel affiché, résultat complet contre l'email (captation du lead, consentement RGPD) ;
- réservation d'un **audit flash de 15 min** via Cal.com (nom et email pré-remplis) ;
- leads enregistrés dans Supabase + notification à jerome@havnn.fr ;
- anti-abus et maîtrise des coûts : captcha, limite par IP et par email, plafond quotidien.

Structure one-page retenue (d'après geobuster.ai, outil d'API Studio, agence alsacienne) :
hero + formulaire, exemple de résultat (marques citées et nombre de citations), 3 offres
(Test gratuit · Audit flash 15 min via Cal.com · Suivi GEO avec le dashboard HAVNN), présentation de Jérôme / Havnn,
FAQ (GEO, différence avec le SEO, IA testées, petite entreprise locale, cité / mentionné / absent, variabilité des réponses…).
Test gratuit sur 1 question (option : 3), pour la rapidité et le coût.

Formulaire du test (comme geobuster) : site web, marque + variantes de nom, question en langage naturel (avec exemples).
Résultat en 4 indicateurs : score, position, contexte (ton employé par les IA), concurrents cités.
Autres sections : « Pourquoi le GEO » (chiffres sourcés et vérifiés), moteurs testés, maquette de conversation
« X n'apparaît nulle part », offres, présentation, FAQ.

Estimation :
- socle (1 question, ChatGPT + Gemini, 4 indicateurs, lead, Cal.com, anti-abus, page complète, FAQ) : 2 séances ;
- par moteur supplémentaire (Perplexity, Mistral, Claude, Grok) : environ 1/4 de séance + un compte API ;
- onglet « Analyse de contenu » (audit d'une page : Schema.org, llms.txt, structure, FAQ) : 1 séance,
  réutilisable pour automatiser le pilier Structure & Factualité des clients ;
- version anglaise : 1/2 séance (non prioritaire pour des TPE/PME alsaciennes).

À faire **après** l'automatisation (même moteur de scan).

## 📋 Clients

- **Ax'home** : piliers Schema.org (page Contact), llms.txt, Sentiment ; corrections NAP restantes (PagesJaunes, Apple Plans).
- **SDI** : piliers Schema.org, llms.txt, Sentiment ; fiche Maisons & Appartements (code postal 67560).
- **Alsa Contrôle** : piliers Schema.org, llms.txt, Sentiment ; 13 fiches NAP à corriger (les noms d'abord).
- **DG&CO** : contrôle de l'indexation du site vers le 13/10 puis à J+30 ; corrections NAP (téléphone Apple Plans en priorité) ; collecte d'avis Google (0 avis).
- **La Sainte Matière** : fiche Bing « temporairement fermée » à rouvrir ; nom Google/Bing à aligner ; adresse Apple Plans ; page « Verrière d'atelier sur mesure ».
- **Tous les clients** : relevé des piliers Schema.org, llms.txt et Sentiment (jamais fait).
- **SolarWrap** : activité, zone et concurrents pour préparer les questions.

## ✅ Fait

- Dashboard client (Cockpit, Benchmark IA & Prompts, Structure & Factualité, Documents & Rapports).
- Clients multi-sites (centres), conformité NAP par fiche, rapport PDF à la demande.
- Déploiement automatique Vercel sur `main`.
- Journal d'activité complet (page dédiée, filtres) et catégorie « Référencement ».
- Relevé quotidien automatique des avis Google (Places API, Vercel Cron).
- Vue admin HAVNN (sélecteur de client, création de client et d'accès, journal, questions, concurrents).
- Robot de relevé ChatGPT + Gemini (GitHub Actions, modes test et publié).
