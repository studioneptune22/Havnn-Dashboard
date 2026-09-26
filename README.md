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
| `/dashboard/rapports` | Rapports mensuels PDF + coffre-fort documentaire (URLs signées Storage) |

## Brancher Supabase

1. Créez un projet Supabase, puis exécutez dans le SQL Editor :
   - `supabase/schema.sql` (tables, enums, vue `prompts_latest`, RLS, bucket Storage `documents`)
   - `supabase/seed.sql` (optionnel, données de démo)
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
`technical_checks` (upsert sur `item_key`), `nap_citations` (upsert sur `platform`), `sentiment_snapshots`.
Seules les colonnes connues sont conservées et `company_id` est toujours injecté par le serveur.
Dans les extraits IA (`ai_snippet`), entourez les mentions de la marque de `**…**` pour les surligner.

## Bilan vidéo mensuel (HyperFrames)

La page `/dashboard/rapports` affiche une vidéo « Bilan GEO du mois » (17 s, 1920×1080) construite avec
[HyperFrames](https://hyperframes.heygen.com) : une composition HTML + GSAP dans
`public/hyperframes/bilan-mensuel/index.html`, lue dans le dashboard par le web component `@hyperframes/player`.

- Les chiffres (score, présence IA, note Google, NAP, part de voix) viennent des mêmes données que le cockpit et sont
  passés à la composition en paramètres d'URL (`src/lib/hyperframes.ts`).
- Les variables sont aussi déclarées sur la composition (`data-composition-variables`) pour le rendu MP4 :

```bash
npm run video:preview   # studio de prévisualisation HyperFrames
npm run video:check     # lint + runtime + layout + contraste
npm run video:render    # → renders/bilan-mensuel.mp4 (Node ≥ 22 + FFmpeg)
npx --yes hyperframes@0.8.78 render public/hyperframes/bilan-mensuel -o renders/client.mp4 \
  --variables '{"company":"Mon entreprise","month":"Octobre 2026","score":78,"scoreDelta":6}'
```

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
public/hyperframes/bilan-mensuel/   # composition vidéo HyperFrames (GSAP embarqué)
supabase/schema.sql · supabase/seed.sql
```

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm run typecheck`
