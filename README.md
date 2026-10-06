# HAVNN — Client Portal

Dashboard client du **Cabinet HAVNN** (conseil marketing, visibilité locale & Generative Engine Optimization).
Il prouve le ROI mensuel aux clients TPE/PME : Score de Dominance GEO, part de voix IA face aux concurrents,
état des intégrations techniques et rapports mensuels.

**Stack** : Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Recharts · lucide-react · Supabase (Auth, Postgres, RLS, Storage).

## Démarrage rapide (mode démo)

```bash
npm install
npm run dev
# → http://localhost:3000
```

Sans variables Supabase, l'application tourne en **mode démo** : pas d'authentification, données fictives
réalistes (Atelier Vogel Paysage, paysagiste à Strasbourg, face à 3 concurrents alsaciens).

## Pages

| Route | Contenu |
| --- | --- |
| `/login` | Connexion email / mot de passe (Supabase Auth) |
| `/dashboard` | Cockpit : header entreprise + sélecteur de période + statut, 4 KPIs héros, part de voix IA, journal d'activité, évolution du score |
| `/dashboard/geo-prompts` | Suivi des 20 prompts métiers (ChatGPT / Perplexity / Gemini), filtres Réussis / Partiels / Manqués, drawer avec l'extrait de réponse IA |
| `/dashboard/audit-technique` | Les 4 piliers GEO : Schema.org, llms.txt, alignement NAP, sentiment de marque |
| `/dashboard/rapports` | Rapports mensuels PDF + coffre-fort documentaire (URLs signées Storage) + bouton « Générer un rapport » |
| `/dashboard/rapports/generer` | Rapport PDF généré à la volée (Cockpit, Benchmark, Structure & Factualité), via `@react-pdf/renderer` |
| `/dashboard/journal` | Journal d'activité complet, par mois, filtrable par catégorie |

## Brancher Supabase

1. Créez un projet Supabase, puis exécutez dans le SQL Editor :
   - `supabase/schema.sql` (tables, enums, vue `prompts_latest`, RLS, bucket Storage `documents`)
   - `supabase/seed.sql` (optionnel, données de démo)
   - `supabase/migrations/*.sql`, dans l'ordre (idempotentes, relançables sans risque)
2. Copiez `.env.example` en `.env.local` et renseignez les clés.
3. Créez l'utilisateur client dans **Authentication > Users**, puis rattachez-le à son entreprise
   (requête en bas de `seed.sql`).

### Sécurité (RLS)

- Un utilisateur `client` ne lit que les lignes de **sa** `company_id` (fonction `current_company_id()`).
- Un utilisateur `havnn_admin` lit toutes les entreprises.
- Aucune écriture côté client : les données arrivent via le webhook (clé `service_role`).
- Storage : les fichiers doivent être rangés sous `<company_id>/...` dans le bucket privé `documents`.

### Tables

Tables du cahier des charges : `companies`, `users`, `geo_scores`, `prompts_monitoring`, `activity_logs`, `documents`.
Tables complémentaires nécessaires aux vues : `share_of_voice` (graphique part de voix), `technical_checks`,
`nap_citations`, `sentiment_snapshots` (audit technique). `geo_scores` est enrichie des champs Google (note, avis)
et du taux de présence par moteur ; `prompts_monitoring` stocke la position par moteur (`position` = meilleure
position, colonne générée).

### Clients multi-sites (`locations`)

Un client peut déclarer plusieurs établissements (centres, agences…) dans la table `locations`, chacun avec
sa note Google. Sans établissement, le portail reste mono-site. Avec des établissements :

- **Cockpit** : note Google du groupe (moyenne pondérée par les avis) et tableau « Vos centres ».
- **Structure & Factualité** : sélecteur de centre (`?centre=<id>`) pour le pilier NAP ; une fiche NAP par
  (établissement, plateforme).
- **Benchmark IA & Prompts** : une question peut être rattachée à un centre (`location_id`), avec un filtre ;
  les questions sans centre sont « transverses ».
- Score, part de voix et taux de présence restent au niveau du groupe.

## Avis Google : relevé quotidien (Vercel Cron)

`GET /api/cron/google-reviews`, chaque jour à 5 h UTC (`vercel.json`), protégé par `CRON_SECRET`.
Pour chaque fiche dont le **Place ID** est renseigné (`companies.google_place_id` pour un client
mono-site, `locations.google_place_id` pour un établissement), la note et le nombre d'avis sont
relevés via Places API (New) et mis à jour (dernier `geo_scores` ou `locations`). Chaque nouvel avis
incrémente « avis capturés ce mois » et ajoute une entrée au journal (catégorie Avis Google).

Variables : `GOOGLE_PLACES_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.

## Alimentation hebdomadaire (Make.com / N8N)

`POST /api/webhooks/ingest` avec le header `x-havnn-webhook-secret: $HAVNN_WEBHOOK_SECRET`.

```json
{
  "type": "geo_scores",
  "company_domain": "atelier-vogel-paysage.fr",
  "records": [
    {
      "score_percentage": 74,
      "ai_presence_rate": 60,
      "nap_errors_count": 1,
      "google_rating": 4.8,
      "google_reviews_total": 191,
      "google_reviews_new": 4,
      "recorded_at": "2026-09-29T06:00:00Z"
    }
  ]
}
```

`type` ∈ `geo_scores`, `prompts_monitoring`, `activity_logs`, `documents`, `share_of_voice`,
`technical_checks` (upsert sur `item_key`), `nap_citations` (upsert sur établissement + `platform`),
`sentiment_snapshots`, `locations` (upsert sur `name`). Pour un client multi-sites, un record `prompts_monitoring`
ou `nap_citations` cible un établissement par `location_id` ou par son nom (`"location": "Autovision Illkirch"`).
Seules les colonnes connues sont conservées et `company_id` est toujours injecté par le serveur.
Dans les extraits IA (`ai_snippet`), entourez les mentions de la marque de `**…**` pour les surligner.

## Structure

```
src/
├─ app/
│  ├─ login/                 # page de connexion
│  ├─ auth/actions.ts        # server actions signIn / signOut
│  ├─ dashboard/             # layout (sidebar) + 4 modules
│  └─ api/webhooks/ingest/   # ingestion Make.com / N8N
├─ components/
│  ├─ ui/                    # composants shadcn/ui
│  ├─ layout/                # sidebar, nav mobile, logo
│  ├─ dashboard/             # KPIs, jauge, graphiques, journal
│  ├─ prompts/               # tableau + drawer des prompts
│  └─ audit/                 # piliers GEO
├─ lib/
│  ├─ supabase/              # clients serveur / admin / middleware
│  └─ data/                  # queries.ts (Supabase ou mock), mock.ts, period.ts
└─ types/database.ts
supabase/schema.sql · supabase/seed.sql · supabase/migrations/
```

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm run typecheck`
