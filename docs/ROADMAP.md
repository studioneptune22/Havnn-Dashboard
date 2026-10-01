# HAVNN — Feuille de route

_Dernière mise à jour : 1er octobre 2026_

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

À faire **après** l'automatisation (même moteur de scan). Estimation : 2 séances (test sur 1 question) à 3 (plusieurs questions).

## 📋 Clients

- **Ax'home** : piliers Schema.org (page Contact), llms.txt, Sentiment ; corrections NAP restantes (PagesJaunes, Apple Plans).
- **SDI** : piliers Schema.org, llms.txt, Sentiment ; fiche Maisons & Appartements (code postal 67560).
- **Alsa Contrôle** : piliers Schema.org, llms.txt, Sentiment ; 13 fiches NAP à corriger (les noms d'abord).
- **DG&CO, La Sainte Matière, SolarWrap** : activité, zone et concurrents pour préparer les questions.

## ✅ Fait

- Dashboard client (Cockpit, Benchmark IA & Prompts, Structure & Factualité, Documents & Rapports).
- Clients multi-sites (centres), conformité NAP par fiche, rapport PDF à la demande.
- Déploiement automatique Vercel sur `main`.
