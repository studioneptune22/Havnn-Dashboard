# HAVNN — Feuille de route

_Dernière mise à jour : 7 octobre 2026_

## 🔧 Prochaines séances

1. **Automatisation hebdomadaire du relevé**
   - Comptes OpenAI, Google AI Studio et Google Cloud (Places API) + limites de dépense.
   - Liste des concurrents et variantes de noms par client (ex. « Ax'home » / « Axhome », règle Autovision hors groupe).
   - Robot hebdomadaire (GitHub Actions, chaque lundi) : questions ChatGPT (GPT-5.6 Terra + recherche web) et
     Gemini (3.8 Flash + recherche Google), analyse des réponses (Flash Lite), score, part de voix, notes Google.
   - Calibrage 1 à 2 semaines en parallèle d'un relevé manuel.
2. **Rapport PDF hebdomadaire** : archivage automatique dans « Historique des rapports », puis brouillon Gmail
   (Google Workspace, mot de passe d'application) avec le PDF en pièce jointe ; envoi 100 % automatique plus tard.
3. _(Option)_ **Page Admin HAVNN** : création de client par formulaire, bascule d'un client à l'autre.
4. _(Option)_ **Rapport PDF V2** : graphiques, page de synthèse, police et couleurs de la charte.
5. **Décision** : bouton « Générer un rapport » visible par les clients ou réservé à HAVNN.
6. **Avis Google automatiques** (code en ligne) : migration 003, clé Places API (New) + alerte budget 5 €,
   `GOOGLE_PLACES_API_KEY` et `CRON_SECRET` dans Vercel, Place ID des 11 fiches, test via « Run ».

## 🚀 Mi-octobre 2026 — Page « Testez votre visibilité IA »

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

## 🎯 Fin 2026 — Tracking GEO V2 (inspiration : outil de l'Agence Onze, sept. 2026)

À faire **après** l'automatisation hebdomadaire, dans cet ordre :

1. **Plusieurs passages par question** (environ 1 séance)
   - chaque question posée 3 fois par semaine et par moteur au lieu d'une : les réponses des IA varient,
     un seul passage donne un « cité / pas cité » au hasard ;
   - affichage en **taux de mention** (ex. « cité dans 67 % des réponses ») et **tendance en points** par question ;
   - coût estimé : quelques euros par mois et par client.
2. **Sources lues par les IA** (1 à 2 séances)
   - enregistrer les sources renvoyées par ChatGPT (recherche web) et Gemini (recherche Google), sans surcoût ;
   - distinguer **mention** (nom dans le texte) et **citation** (site du client dans les sources) ;
   - page « Sources à travailler » : sites lus par les IA qui citent les concurrents mais pas le client,
     avec le nombre de questions concernées et l'action proposée (créer une fiche, demander une mention, article…) ;
   - **avantage HAVNN : relier les sources au NAP** (« ChatGPT lit PagesJaunes sur 6 questions et votre fiche
     PagesJaunes a une mauvaise adresse → priorité ») : du GEO local actionnable.
3. **Écarté** : métriques SEO des sources (trafic, DR) et prix d'achat d'articles (Linkavista, adsy…) :
   outils payants, et l'achat d'articles n'est pas le bon levier pour des artisans locaux.

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
