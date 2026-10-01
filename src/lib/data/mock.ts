/**
 * Mock data réalistes utilisées quand Supabase n'est pas configuré ("mode démo").
 * Client fictif : Atelier Vogel Paysage — paysagiste à Strasbourg (67).
 */
import type {
  ActivityLog,
  AiCitationStatus,
  Company,
  DocumentItem,
  GeoScore,
  NapCitation,
  PromptMonitoring,
  SentimentSnapshot,
  ShareOfVoice,
  TechnicalCheck,
} from "@/types/database";

export const DEMO_COMPANY_ID = "8f1c2a7e-3b4d-4e5f-9a1b-2c3d4e5f6a7b";
const cid = DEMO_COMPANY_ID;

export const mockCompany: Company = {
  id: cid,
  name: "Atelier Vogel Paysage",
  domain: "atelier-vogel-paysage.fr",
  city: "Strasbourg",
  sector: "Paysagiste & aménagement extérieur",
  plan_status: "active",
  created_at: "2025-10-06T09:00:00Z",
};

// -----------------------------------------------------------------------------
// Historique mensuel des scores (12 derniers mois, snapshot de fin de mois)
// -----------------------------------------------------------------------------
const history: Array<[string, number, number, number, number, number, number]> = [
  // date,        score, presence, nap, rating, total, new
  ["2025-10-31", 18, 10, 23, 4.3, 96, 3],
  ["2025-11-30", 24, 15, 17, 4.4, 101, 5],
  ["2025-12-31", 29, 20, 12, 4.4, 105, 4],
  ["2026-01-31", 34, 25, 9, 4.5, 111, 6],
  ["2026-02-28", 39, 28, 7, 4.5, 118, 7],
  ["2026-03-31", 45, 33, 6, 4.6, 127, 9],
  ["2026-04-30", 51, 38, 5, 4.6, 138, 11],
  ["2026-05-31", 55, 42, 4, 4.7, 149, 11],
  ["2026-06-30", 60, 46, 4, 4.7, 158, 9],
  ["2026-07-31", 63, 49, 3, 4.7, 166, 8],
  ["2026-08-31", 66, 52, 3, 4.8, 173, 7],
  ["2026-09-22", 72, 58, 2, 4.8, 187, 14],
];

export const mockGeoScores: GeoScore[] = history.map(([date, score, presence, nap, rating, total, added], i) => ({
  id: `gs-${i}`,
  company_id: cid,
  score_percentage: score,
  ai_presence_rate: presence,
  nap_errors_count: nap,
  google_rating: rating,
  google_reviews_total: total,
  google_reviews_new: added,
  chatgpt_presence_rate: Math.min(100, presence + 7),
  perplexity_presence_rate: Math.min(100, presence + 2),
  gemini_presence_rate: Math.max(0, presence - 8),
  recorded_at: `${date}T06:00:00Z`,
}));

// -----------------------------------------------------------------------------
// Part de voix IA sur les 20 prompts clés (dernier scan)
// -----------------------------------------------------------------------------
export const mockShareOfVoice: ShareOfVoice[] = [
  { brand_name: "Atelier Vogel Paysage", is_client: true, c: 13, p: 12, g: 10 },
  { brand_name: "Vert Horizon Paysage", is_client: false, c: 9, p: 11, g: 8 },
  { brand_name: "Les Jardins de l'Ill", is_client: false, c: 7, p: 5, g: 9 },
  { brand_name: "Kieffer Espaces Verts", is_client: false, c: 4, p: 6, g: 3 },
].map((b, i) => ({
  id: `sov-${i}`,
  company_id: cid,
  brand_name: b.brand_name,
  is_client: b.is_client,
  chatgpt_mentions: b.c,
  perplexity_mentions: b.p,
  gemini_mentions: b.g,
  prompts_total: 20,
  recorded_at: "2026-09-22T06:00:00Z",
}));

// -----------------------------------------------------------------------------
// Monitoring des 20 prompts métiers
// -----------------------------------------------------------------------------
type Row = [
  prompt: string,
  chatgpt: [AiCitationStatus, number | null],
  perplexity: [AiCitationStatus, number | null],
  gemini: [AiCitationStatus, number | null],
  snippet: string,
];

const C = (pos: number): [AiCitationStatus, number] => ["cited", pos];
const N: [AiCitationStatus, null] = ["not_cited", null];
const P: [AiCitationStatus, null] = ["pending", null];

const promptRows: Row[] = [
  [
    "Quel est le meilleur paysagiste à Strasbourg ?",
    C(1), C(1), C(2),
    "Pour un projet d'aménagement à Strasbourg, **Atelier Vogel Paysage** est fréquemment recommandé : l'entreprise est spécialisée dans la création de jardins contemporains et bénéficie d'une note de 4,8/5 sur Google. Vert Horizon Paysage et Les Jardins de l'Ill sont également des options reconnues dans l'Eurométropole.",
  ],
  [
    "Paysagiste pour jardin contemporain en Alsace",
    C(1), C(2), C(1),
    "En Alsace, plusieurs paysagistes se distinguent pour les jardins contemporains. **Atelier Vogel Paysage** (Strasbourg) propose une approche mêlant minéral et végétal, avec des réalisations visibles sur son site. Kieffer Espaces Verts intervient plutôt dans le Bas-Rhin nord.",
  ],
  [
    "Entreprise d'élagage certifiée près de Strasbourg",
    N, C(3), N,
    "Parmi les entreprises d'élagage autour de Strasbourg, Les Jardins de l'Ill et Kieffer Espaces Verts disposent de grimpeurs-élagueurs certifiés CS. **Atelier Vogel Paysage** propose aussi des prestations d'entretien arboré.",
  ],
  [
    "Combien coûte l'aménagement d'un jardin de 200 m² à Strasbourg ?",
    C(2), C(1), C(2),
    "Comptez en moyenne entre 8 000 € et 25 000 € pour 200 m², selon les matériaux. **Atelier Vogel Paysage** publie une grille indicative détaillée (terrasse, gazon, plantations) qui sert souvent de référence locale.",
  ],
  [
    "Paysagiste éco-responsable Bas-Rhin",
    C(1), C(1), C(1),
    "**Atelier Vogel Paysage** met en avant une démarche éco-responsable : récupération d'eau de pluie, plantes locales et gestion différenciée. C'est l'un des acteurs les plus cités sur ce créneau dans le Bas-Rhin.",
  ],
  [
    "Création de terrasse en bois à Illkirch-Graffenstaden",
    C(2), N, C(3),
    "Pour une terrasse bois à Illkirch, Vert Horizon Paysage et **Atelier Vogel Paysage** proposent des essences durables (ipé, pin traité classe 4, douglas).",
  ],
  [
    "Qui contacter pour l'entretien d'espaces verts d'entreprise à Strasbourg ?",
    N, N, N,
    "Pour l'entretien d'espaces verts en entreprise, les acteurs les plus cités sont Kieffer Espaces Verts et Vert Horizon Paysage, qui proposent des contrats annuels pour les sièges sociaux et zones d'activité.",
  ],
  [
    "Meilleur paysagiste à Colmar",
    N, C(4), N,
    "À Colmar, Les Jardins de l'Ill est régulièrement recommandé. Des entreprises strasbourgeoises comme **Atelier Vogel Paysage** interviennent aussi dans le Haut-Rhin pour des projets d'envergure.",
  ],
  [
    "Paysagiste pour piscine naturelle en Alsace",
    C(1), C(2), N,
    "Les piscines naturelles (baignades biologiques) restent une spécialité rare en Alsace. **Atelier Vogel Paysage** en a réalisé plusieurs autour de Strasbourg et documente ses chantiers en détail.",
  ],
  [
    "Avis sur Atelier Vogel Paysage",
    C(1), C(1), C(1),
    "**Atelier Vogel Paysage** bénéficie d'avis très positifs (4,8/5 sur 187 avis Google). Les clients soulignent la qualité du suivi de chantier, le respect des délais et la créativité des propositions.",
  ],
  [
    "Engazonnement et arrosage automatique Strasbourg",
    C(3), C(2), C(2),
    "Pour l'engazonnement avec arrosage intégré, Vert Horizon Paysage, **Atelier Vogel Paysage** et Kieffer Espaces Verts sont les trois prestataires les plus cités dans l'Eurométropole.",
  ],
  [
    "Aménagement paysager pour copropriété Strasbourg",
    N, C(3), C(2),
    "Pour les copropriétés, Les Jardins de l'Ill propose des contrats syndic. **Atelier Vogel Paysage** accompagne aussi des résidences sur la conception et la végétalisation des parties communes.",
  ],
  [
    "Paysagiste qui fait des murs végétaux en Alsace",
    C(2), N, N,
    "Les murs végétaux intérieurs et extérieurs sont proposés par **Atelier Vogel Paysage** et quelques entreprises spécialisées de Mulhouse.",
  ],
  [
    "Crédit d'impôt entretien de jardin Alsace : quel prestataire ?",
    N, N, C(4),
    "L'entretien de jardin ouvre droit à 50 % de crédit d'impôt via les services à la personne. Kieffer Espaces Verts et Vert Horizon Paysage sont agréés SAP. **Atelier Vogel Paysage** est également mentionné.",
  ],
  [
    "Création de jardin japonais à Strasbourg",
    C(1), C(1), C(3),
    "**Atelier Vogel Paysage** est souvent cité pour ses jardins d'inspiration japonaise (pas japonais, érables, graviers ratissés), notamment à Strasbourg-Robertsau.",
  ],
  [
    "Paysagiste à Haguenau",
    N, N, N,
    "À Haguenau, Kieffer Espaces Verts est l'entreprise la plus citée, suivie de plusieurs indépendants locaux.",
  ],
  [
    "Clôture et portail paysager Eurométropole de Strasbourg",
    C(2), C(3), N,
    "Pour une clôture végétalisée ou un portail intégré au paysage, Vert Horizon Paysage et **Atelier Vogel Paysage** proposent des solutions sur mesure.",
  ],
  [
    "Paysagiste recommandé pour un jardin de ville en petit espace",
    C(1), C(2), C(2),
    "Pour les petits jardins urbains, **Atelier Vogel Paysage** propose une offre « jardin de ville » : optimisation des volumes, bacs sur mesure, végétaux adaptés à l'ombre.",
  ],
  [
    "Devis paysagiste en ligne Alsace",
    P, P, P,
    "Scan en cours de traitement — résultat disponible au prochain rapport hebdomadaire.",
  ],
  [
    "Éclairage extérieur de jardin par un paysagiste à Strasbourg",
    N, C(2), C(4),
    "La mise en lumière du jardin est proposée par Les Jardins de l'Ill et **Atelier Vogel Paysage**, en partenariat avec des électriciens certifiés.",
  ],
];

const scanDates = ["2026-09-22T05:12:00Z", "2026-09-22T05:14:00Z", "2026-09-21T05:08:00Z"];

export const mockPrompts: PromptMonitoring[] = promptRows.map(([prompt, c, p, g, snippet], i) => ({
  id: `pr-${i}`,
  company_id: cid,
  prompt_text: prompt,
  chatgpt_status: c[0],
  perplexity_status: p[0],
  gemini_status: g[0],
  chatgpt_position: c[1],
  perplexity_position: p[1],
  gemini_position: g[1],
  position: [c[1], p[1], g[1]].filter((x): x is number => x !== null).sort((a, b) => a - b)[0] ?? null,
  ai_snippet: snippet,
  ai_snippets: {},
  location_id: null,
  scanned_at: scanDates[i % scanDates.length],
}));

// -----------------------------------------------------------------------------
// Journal d'activité HAVNN
// -----------------------------------------------------------------------------
const activities: Array<[string, string, ActivityLog["category"], string]> = [
  ["Scan hebdomadaire des 20 prompts métiers", "ChatGPT, Perplexity et Gemini scannés. +2 prompts gagnés vs semaine dernière (Colmar, éclairage extérieur).", "monitoring", "2026-09-22T06:00:00Z"],
  ["14 nouveaux avis Google capturés", "Campagne QR code post-chantier : 14 avis 5★ collectés en septembre, 100 % des avis ont reçu une réponse.", "reviews", "2026-09-18T14:30:00Z"],
  ["Balisage Schema.org FAQPage injecté", "12 questions/réponses structurées ajoutées sur les pages Services et Tarifs.", "schema", "2026-09-12T10:15:00Z"],
  ["Fichier llms.txt mis à jour", "Ajout des nouvelles réalisations 2026 et de la zone d'intervention Haut-Rhin.", "llms_txt", "2026-09-09T16:40:00Z"],
  ["30 annuaires synchronisés", "Alignement NAP sur PagesJaunes, Hoodspot, Cylex, Justacoté et 26 annuaires locaux.", "nap", "2026-09-05T09:00:00Z"],
  ["Rapport mensuel d'août publié", "Score de Dominance GEO : 66 % (+3 pts). Disponible dans l'espace Documents.", "report", "2026-09-02T08:00:00Z"],
  ["Article expert publié : « Budget d'un jardin à Strasbourg »", "Contenu optimisé citabilité IA (données chiffrées, sources, FAQ).", "content", "2026-08-28T11:20:00Z"],
  ["Balisage Service & LocalBusiness enrichi", "Ajout des zones desservies (areaServed) et des horaires saisonniers.", "schema", "2026-08-21T15:05:00Z"],
];

export const mockActivity: ActivityLog[] = activities.map(([title, description, category, created_at], i) => ({
  id: `act-${i}`,
  company_id: cid,
  title,
  description,
  category,
  created_at,
}));

// -----------------------------------------------------------------------------
// Audit technique : 4 piliers GEO
// -----------------------------------------------------------------------------
const checks: Array<[TechnicalCheck["pillar"], string, string, TechnicalCheck["status"], string]> = [
  ["schema", "schema.LocalBusiness", "LocalBusiness", "ok", "Présent sur toutes les pages · adresse, géocoordonnées, horaires, areaServed."],
  ["schema", "schema.Organization", "Organization", "ok", "Logo, SIRET, profils sociaux (sameAs) déclarés."],
  ["schema", "schema.FAQPage", "FAQPage", "ok", "12 Q/R valides sur /services et /tarifs (injecté le 12/09)."],
  ["schema", "schema.Service", "Service", "warning", "4 services balisés sur 6 · « Élagage » et « Éclairage extérieur » à compléter."],
  ["llms_txt", "llms_txt.root", "Fichier /llms.txt à la racine", "ok", "Accessible (HTTP 200) · 2,4 Ko · mis à jour le 09/09."],
  ["llms_txt", "llms_txt.full", "Fichier /llms-full.txt (version étendue)", "pending", "Planifié pour octobre : export complet des fiches services et réalisations."],
  ["llms_txt", "llms_txt.robots", "Crawlers IA autorisés (robots.txt)", "ok", "GPTBot, PerplexityBot, Google-Extended et ClaudeBot autorisés."],
];

export const mockTechnicalChecks: TechnicalCheck[] = checks.map(([pillar, item_key, label, status, details], i) => ({
  id: `tc-${i}`,
  company_id: cid,
  pillar,
  item_key,
  label,
  status,
  details,
  checked_at: "2026-09-22T06:00:00Z",
}));

const nap: Array<[string, boolean, boolean, boolean]> = [
  ["Google Business Profile", true, true, true],
  ["PagesJaunes", true, true, true],
  ["Facebook", true, true, true],
  ["Apple Plans", true, true, true],
  ["Bing Places", true, true, true],
  ["Houzz", true, false, true],
  ["Annuaire Mairie Strasbourg", true, true, false],
  ["Cylex", true, true, true],
];

export const mockNapCitations: NapCitation[] = nap.map(([platform, name_ok, address_ok, phone_ok], i) => ({
  id: `nap-${i}`,
  company_id: cid,
  location_id: null,
  platform,
  listing_url: null,
  name_ok,
  address_ok,
  phone_ok,
  checked_at: "2026-09-22T06:00:00Z",
}));

export const mockSentiment: SentimentSnapshot[] = [
  {
    id: "sent-0",
    company_id: cid,
    source: "google_reviews",
    positive_pct: 91,
    neutral_pct: 6,
    critical_pct: 3,
    summary: "Qualité des finitions, ponctualité et conseils sont les thèmes les plus cités. Seul point critique récurrent : délais de devis en haute saison.",
    recorded_at: "2026-09-22T06:00:00Z",
  },
  {
    id: "sent-1",
    company_id: cid,
    source: "llm_answers",
    positive_pct: 78,
    neutral_pct: 20,
    critical_pct: 2,
    summary: "Les IA décrivent la marque comme « spécialiste des jardins contemporains et éco-responsables ». Aucune information erronée détectée ce mois-ci.",
    recorded_at: "2026-09-22T06:00:00Z",
  },
];

// -----------------------------------------------------------------------------
// Documents
// -----------------------------------------------------------------------------
const docs: Array<[string, DocumentItem["category"], number, string | null, string]> = [
  ["Rapport mensuel GEO — Août 2026", "monthly_report", 2_480_000, "2026-08-01", "2026-09-02T08:00:00Z"],
  ["Rapport mensuel GEO — Juillet 2026", "monthly_report", 2_310_000, "2026-07-01", "2026-08-03T08:00:00Z"],
  ["Rapport mensuel GEO — Juin 2026", "monthly_report", 2_205_000, "2026-06-01", "2026-07-02T08:00:00Z"],
  ["Rapport mensuel GEO — Mai 2026", "monthly_report", 2_150_000, "2026-05-01", "2026-06-02T08:00:00Z"],
  ["Rapport mensuel GEO — Avril 2026", "monthly_report", 1_980_000, "2026-04-01", "2026-05-04T08:00:00Z"],
  ["Feuille de route GEO initiale (audit 360°)", "roadmap", 4_120_000, null, "2025-10-10T10:00:00Z"],
  ["Contrat d'accompagnement HAVNN — 12 mois", "contract", 380_000, null, "2025-10-06T09:00:00Z"],
  ["Export prompts & positions — Septembre 2026", "csv_export", 48_000, "2026-09-01", "2026-09-22T06:30:00Z"],
  ["Export citations NAP — Septembre 2026", "csv_export", 12_500, "2026-09-01", "2026-09-05T09:30:00Z"],
];

export const mockDocuments: DocumentItem[] = docs.map(([title, category, file_size, period, created_at], i) => ({
  id: `doc-${i}`,
  company_id: cid,
  title,
  file_url: "#",
  category,
  file_size,
  period,
  created_at,
}));
