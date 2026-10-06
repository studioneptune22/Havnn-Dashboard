import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { ENGINE_LABELS } from "@/components/dashboard/chart-theme";
import type {
  ActivityLog,
  AiCitationStatus,
  AiEngine,
  CheckStatus,
  Company,
  GeoScore,
  Location,
  NapCitation,
  PromptMonitoring,
  SentimentSnapshot,
  ShareOfVoice,
  TechnicalCheck,
} from "@/types/database";

import { HAVNN_LOGO, HAVNN_MARK } from "./logo";

/** Auteur affiché sur la couverture et en pied de page. */
export const REPORT_AUTHOR = { name: "Jérôme VAGUE", title: "Founder", company: "Havnn" };

export interface ReportData {
  company: Company;
  generatedAt: Date;
  engines: readonly AiEngine[];
  // Cockpit
  latest: GeoScore | null;
  previous: GeoScore | null;
  history: GeoScore[];
  googleRating: number | null;
  googleReviews: number;
  shareOfVoice: ShareOfVoice[];
  activity: ActivityLog[];
  locations: Location[];
  // Benchmark
  prompts: PromptMonitoring[];
  // Structure & Factualité
  checks: TechnicalCheck[];
  nap: NapCitation[];
  sentiment: SentimentSnapshot[];
  pillars: Array<{ label: string; score: number | null }>;
}

// -----------------------------------------------------------------------------
// Charte
// -----------------------------------------------------------------------------
const C = {
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  soft: "#f8fafc",
  blue: "#2563eb",
  green: "#059669",
  amber: "#d97706",
  red: "#e11d48",
  engines: { chatgpt: "#3987e5", perplexity: "#d95926", gemini: "#199e70" } as Record<AiEngine, string>,
};

const s = StyleSheet.create({
  page: { paddingTop: 64, paddingBottom: 56, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 9, color: C.ink },
  header: {
    position: "absolute", top: 22, left: 40, right: 40, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8,
  },
  headerMark: { width: 14, height: 19 },
  headerText: { fontSize: 8, color: C.muted },
  footer: {
    position: "absolute", bottom: 22, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6, fontSize: 7, color: C.muted,
  },
  eyebrow: { fontSize: 8, color: C.blue, letterSpacing: 1, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6 },
  lead: { fontSize: 9, color: C.muted, marginBottom: 12 },
  muted: { color: C.muted },
  bold: { fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row" },
  // Cartes KPI
  kpis: { flexDirection: "row", gap: 8 },
  kpi: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 10, backgroundColor: C.soft },
  kpiLabel: { fontSize: 7.5, color: C.muted, marginBottom: 6 },
  kpiValue: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  kpiUnit: { fontSize: 10, color: C.muted },
  kpiNote: { fontSize: 7.5, color: C.muted, marginTop: 4 },
  // Tableaux
  table: { borderWidth: 1, borderColor: C.line, borderRadius: 4 },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 4, paddingHorizontal: 6, alignItems: "center" },
  th: {
    flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6, backgroundColor: C.soft,
    fontSize: 7, color: C.muted, fontFamily: "Helvetica-Bold",
  },
  bar: { height: 5, borderRadius: 2 },
  pill: { fontSize: 7, paddingVertical: 1.5, paddingHorizontal: 4, borderRadius: 3, alignSelf: "flex-start" },
});

// -----------------------------------------------------------------------------
// Formatage
// -----------------------------------------------------------------------------
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(Number(v))} %`);
const dec = (v: number | null | undefined) =>
  v === null || v === undefined
    ? "—"
    : pdfSafe(Number(v).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
const date = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

export function formatGeneratedAt(d: Date) {
  const day = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long" }).format(d);
  const time = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(d);
  return pdfSafe(`${day} à ${time}`);
}

function delta(curr: number | null | undefined, prev: number | null | undefined, unit = " pts", invert = false) {
  if (curr === null || curr === undefined || prev === null || prev === undefined) return null;
  const d = Math.round(Number(curr) - Number(prev));
  if (d === 0) return { text: `= vs mois dernier`, color: C.muted };
  const good = invert ? d < 0 : d > 0;
  return { text: `${d > 0 ? "+" : ""}${d}${unit} vs mois dernier`, color: good ? C.green : C.red };
}

const scoreColor = (v: number | null) => (v === null ? C.muted : v >= 90 ? C.green : v >= 60 ? C.blue : C.amber);

const STATUS: Record<AiCitationStatus, { label: string; color: string }> = {
  cited: { label: "Cité", color: C.green },
  not_cited: { label: "Non cité", color: C.red },
  pending: { label: "En attente", color: C.muted },
};

const CHECK: Record<CheckStatus, { label: string; color: string }> = {
  ok: { label: "Conforme", color: C.green },
  warning: { label: "À compléter", color: C.amber },
  error: { label: "À corriger", color: C.red },
  pending: { label: "Planifié", color: C.muted },
};

const ACTIVITY_LABEL: Record<ActivityLog["category"], string> = {
  schema: "Schema.org", nap: "NAP & annuaires", content: "Contenu", reviews: "Avis Google",
  llms_txt: "llms.txt", report: "Rapport", monitoring: "Monitoring IA", seo: "Référencement", other: "Action",
};

// La police standard des PDF (Helvetica, encodage WinAnsi) n'a ni emoji ni symboles
// comme ★ : on les remplace pour éviter les blancs dans le texte saisi par HAVNN.
const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
const REPLACEMENTS: Record<string, string> = { "★": "*", "☆": "*", "→": "->", "≥": ">=", "≤": "<=", "✓": "OK", "✔": "OK", "\u202f": " " };

function pdfSafe(text: string) {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code <= 0xff || WIN_ANSI_EXTRA.has(ch)) out += ch;
    else if (ch in REPLACEMENTS) out += REPLACEMENTS[ch];
  }
  return out;
}

/** Applique pdfSafe à toutes les chaînes des données du rapport. */
function sanitize<T>(value: T): T {
  if (typeof value === "string") return pdfSafe(value) as T;
  if (Array.isArray(value)) return value.map(sanitize) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v)])) as T;
  }
  return value;
}

// -----------------------------------------------------------------------------
// Briques
// -----------------------------------------------------------------------------
function Chrome({ data }: { data: ReportData }) {
  return (
    <>
      <View style={s.header} fixed>
        <View style={[s.row, { alignItems: "center", gap: 6 }]}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image react-pdf, pas une balise <img> */}
          <Image src={HAVNN_MARK} style={s.headerMark} />
          <Text style={[s.headerText, s.bold, { color: C.ink }]}>HAVNN</Text>
        </View>
        <Text style={s.headerText}>Rapport GEO · {data.company.name}</Text>
      </View>
      <View style={s.footer} fixed>
        <Text>
          Généré le {formatGeneratedAt(data.generatedAt)} · {REPORT_AUTHOR.name} · {REPORT_AUTHOR.title} · {REPORT_AUTHOR.company}
        </Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </>
  );
}

function Kpi({ label, value, unit, note, sub }: { label: string; value: string; unit?: string; note?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <View style={s.kpi}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text>
        <Text style={s.kpiValue}>{value}</Text>
        {unit && <Text style={s.kpiUnit}> {unit}</Text>}
      </Text>
      {sub}
      {note}
    </View>
  );
}

function DeltaText({ d }: { d: ReturnType<typeof delta> }) {
  if (!d) return null;
  return <Text style={[s.kpiNote, { color: d.color }]}>{d.text}</Text>;
}

function Pill({ label, color }: { label: string; color: string }) {
  return <Text style={[s.pill, { color, borderWidth: 0.75, borderColor: color }]}>{label}</Text>;
}

function Empty({ children }: { children: string }) {
  return <Text style={[s.muted, { paddingVertical: 6 }]}>{children}</Text>;
}

// -----------------------------------------------------------------------------
// Document
// -----------------------------------------------------------------------------
export function ReportDocument({ data: raw }: { data: ReportData }) {
  const data = sanitize(raw);
  const { company, latest, previous, engines, locations } = data;
  const multiSite = locations.length > 0;
  const locationName = new Map(locations.map((l) => [l.id, l.name]));
  const subtitle = [company.sector, multiSite ? `${locations.length} centres` : company.city].filter(Boolean).join(" · ");

  // Part de voix
  const mentions = (b: ShareOfVoice) => engines.reduce((sum, e) => sum + b[`${e}_mentions`], 0);
  const totalMentions = data.shareOfVoice.reduce((sum, b) => sum + mentions(b), 0);
  const maxMentions = Math.max(1, ...data.shareOfVoice.map(mentions));
  const promptsTotal = data.shareOfVoice[0]?.prompts_total ?? data.prompts.length;

  // Benchmark
  const scanned = data.prompts.filter((p) => engines.some((e) => p[`${e}_status`] !== "pending"));
  const citedSomewhere = scanned.filter((p) => engines.some((e) => p[`${e}_status`] === "cited")).length;
  const citations = scanned.flatMap((p) => engines.map((e) => p[`${e}_status`])).filter((x) => x !== "pending");
  const citationRate = citations.length ? Math.round((citations.filter((x) => x === "cited").length / citations.length) * 100) : 0;
  const firstPlace = scanned.filter((p) => engines.some((e) => p[`${e}_position`] === 1)).length;
  const prompts = [...data.prompts].sort((a, b) => {
    const la = a.location_id ? locationName.get(a.location_id) ?? "" : "~";
    const lb = b.location_id ? locationName.get(b.location_id) ?? "" : "~";
    return la.localeCompare(lb, "fr") || a.prompt_text.localeCompare(b.prompt_text, "fr");
  });

  // NAP
  const centre = (c: NapCitation) => (c.location_id && locationName.get(c.location_id)) || "Groupe";
  const nap = multiSite
    ? [...data.nap].sort((a, b) => centre(a).localeCompare(centre(b), "fr") || a.platform.localeCompare(b.platform, "fr"))
    : data.nap;

  return (
    <Document title={`Rapport GEO · ${company.name}`} author={`${REPORT_AUTHOR.name} · ${REPORT_AUTHOR.company}`} creator="HAVNN Client Portal">
      {/* ------------------------------------------------------------ Couverture */}
      <Page size="A4" style={[s.page, { paddingTop: 40 }]}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View style={{ alignItems: "center", marginTop: 90 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image react-pdf, pas une balise <img> */}
            <Image src={HAVNN_LOGO} style={{ width: 130, height: 125 }} />
            <Text style={[s.eyebrow, { marginTop: 48 }]}>RAPPORT DE VISIBILITÉ IA · GEO</Text>
            <Text style={{ fontSize: 26, fontFamily: "Helvetica-Bold", marginTop: 6, textAlign: "center" }}>{company.name}</Text>
            {subtitle && <Text style={[s.muted, { fontSize: 11, marginTop: 6 }]}>{subtitle}</Text>}
            <Text style={{ fontSize: 10, marginTop: 28 }}>Généré le {formatGeneratedAt(data.generatedAt)}</Text>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 14, flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={[s.muted, { fontSize: 8, marginBottom: 3 }]}>Préparé par</Text>
              <Text style={[s.bold, { fontSize: 11 }]}>{REPORT_AUTHOR.name}</Text>
              <Text style={s.muted}>
                {REPORT_AUTHOR.title} · {REPORT_AUTHOR.company}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", justifyContent: "flex-end" }}>
              <Text style={[s.muted, { fontSize: 8 }]}>Sommaire</Text>
              <Text style={{ fontSize: 8 }}>1. Cockpit GEO</Text>
              <Text style={{ fontSize: 8 }}>2. Benchmark IA & Prompts</Text>
              <Text style={{ fontSize: 8 }}>3. Structure & Factualité</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* --------------------------------------------------------------- Cockpit */}
      <Page size="A4" style={s.page}>
        <Chrome data={data} />
        <Text style={s.eyebrow}>1 · COCKPIT GEO</Text>
        <Text style={s.h1}>Vue d&apos;ensemble</Text>
        <Text style={s.lead}>
          {latest
            ? `Indicateurs du dernier relevé, réalisé le ${date(latest.recorded_at)}.`
            : "Les premières données seront disponibles après le scan initial."}
        </Text>

        {latest && (
          <>
            <View style={s.kpis}>
              <Kpi
                label="Score de Dominance GEO"
                value={String(Math.round(Number(latest.score_percentage)))}
                unit="%"
                note={<DeltaText d={delta(latest.score_percentage, previous?.score_percentage)} />}
              />
              <Kpi
                label="Taux de présence IA (Top 3)"
                value={String(Math.round(Number(latest.ai_presence_rate)))}
                unit="%"
                sub={
                  <View style={{ marginTop: 4 }}>
                    {engines.map((e) => {
                      const rate = latest[`${e}_presence_rate`];
                      return rate === null ? null : (
                        <Text key={e} style={s.kpiNote}>
                          {ENGINE_LABELS[e]} : {pct(rate)}
                        </Text>
                      );
                    })}
                  </View>
                }
                note={<DeltaText d={delta(latest.ai_presence_rate, previous?.ai_presence_rate)} />}
              />
              <Kpi
                label={multiSite ? "Note Google (groupe)" : "Note Google"}
                value={dec(data.googleRating)}
                unit="/ 5"
                note={
                  <Text style={s.kpiNote}>
                    {data.googleReviews} avis{multiSite ? ` sur ${locations.length} fiches (moyenne pondérée)` : ""}
                  </Text>
                }
              />
              <Kpi
                label="Fiches NAP à corriger"
                value={String(latest.nap_errors_count)}
                note={<DeltaText d={delta(latest.nap_errors_count, previous?.nap_errors_count, "", true)} />}
              />
            </View>

            <Text style={s.h2} minPresenceAhead={60}>Part de voix IA</Text>
            {data.shareOfVoice.length === 0 ? (
              <Empty>Benchmark concurrentiel en préparation.</Empty>
            ) : (
              <View style={s.table}>
                <View style={s.th}>
                  <Text style={{ flex: 3 }}>MARQUE</Text>
                  {engines.map((e) => (
                    <Text key={e} style={{ flex: 1, textAlign: "right" }}>
                      {ENGINE_LABELS[e].toUpperCase()}
                    </Text>
                  ))}
                  <Text style={{ flex: 1, textAlign: "right" }}>TOTAL</Text>
                  <Text style={{ flex: 1, textAlign: "right" }}>PART</Text>
                  <Text style={{ flex: 2.4, paddingLeft: 10 }}>{`CITATIONS (SUR ${promptsTotal} PROMPTS)`}</Text>
                </View>
                {[...data.shareOfVoice]
                  .sort((a, b) => Number(b.is_client) - Number(a.is_client) || mentions(b) - mentions(a))
                  .map((b) => {
                    const m = mentions(b);
                    return (
                      <View key={b.id} style={[s.tr, b.is_client ? { backgroundColor: "#eff6ff" } : {}]}>
                        <Text style={[{ flex: 3 }, b.is_client ? s.bold : {}]}>{b.brand_name}</Text>
                        {engines.map((e) => (
                          <Text key={e} style={{ flex: 1, textAlign: "right" }}>
                            {b[`${e}_mentions`]}
                          </Text>
                        ))}
                        <Text style={[{ flex: 1, textAlign: "right" }, s.bold]}>{m}</Text>
                        <Text style={{ flex: 1, textAlign: "right" }}>
                          {totalMentions ? `${Math.round((m / totalMentions) * 100)} %` : "—"}
                        </Text>
                        <View style={{ flex: 2.4, paddingLeft: 10, flexDirection: "row" }}>
                          {engines.map((e) => (
                            <View
                              key={e}
                              style={[s.bar, { width: `${(b[`${e}_mentions`] / maxMentions) * 50}%`, backgroundColor: C.engines[e] }]}
                            />
                          ))}
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}

            {multiSite && (
              <>
                <Text style={s.h2} minPresenceAhead={60}>Vos centres</Text>
                <View style={s.table}>
                  <View style={s.th}>
                    <Text style={{ flex: 3 }}>CENTRE</Text>
                    <Text style={{ flex: 4 }}>ADRESSE</Text>
                    <Text style={{ flex: 1, textAlign: "right" }}>NOTE</Text>
                    <Text style={{ flex: 1, textAlign: "right" }}>AVIS</Text>
                    <Text style={{ flex: 1.4, textAlign: "right" }}>FICHES NAP OK</Text>
                  </View>
                  {locations.map((l) => {
                    const own = data.nap.filter((c) => c.location_id === l.id);
                    const ok = own.filter((c) => c.name_ok && c.address_ok && c.phone_ok).length;
                    return (
                      <View key={l.id} style={s.tr} wrap={false}>
                        <Text style={[{ flex: 3 }, s.bold]}>{l.name}</Text>
                        <Text style={[{ flex: 4 }, s.muted]}>
                          {[l.address, [l.postal_code, l.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                        </Text>
                        <Text style={{ flex: 1, textAlign: "right" }}>{dec(l.google_rating)}</Text>
                        <Text style={{ flex: 1, textAlign: "right" }}>{l.google_reviews_total ?? "—"}</Text>
                        <Text style={{ flex: 1.4, textAlign: "right", color: own.length === 0 ? C.muted : ok === own.length ? C.green : C.amber }}>
                          {own.length ? `${ok} / ${own.length}` : "—"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {data.history.length > 1 && (
              <>
                <Text style={s.h2} minPresenceAhead={60}>Évolution de la dominance GEO</Text>
                <View style={s.table}>
                  <View style={s.th}>
                    <Text style={{ flex: 2 }}>RELEVÉ</Text>
                    <Text style={{ flex: 2, textAlign: "right" }}>SCORE GEO</Text>
                    <Text style={{ flex: 2, textAlign: "right" }}>PRÉSENCE IA</Text>
                    <Text style={{ flex: 2, textAlign: "right" }}>NOTE GOOGLE</Text>
                    <Text style={{ flex: 2, textAlign: "right" }}>FICHES NAP À CORRIGER</Text>
                  </View>
                  {[...data.history].reverse().slice(0, 12).map((g) => (
                    <View key={g.id} style={s.tr} wrap={false}>
                      <Text style={{ flex: 2 }}>{date(g.recorded_at)}</Text>
                      <Text style={{ flex: 2, textAlign: "right" }}>{pct(g.score_percentage)}</Text>
                      <Text style={{ flex: 2, textAlign: "right" }}>{pct(g.ai_presence_rate)}</Text>
                      <Text style={{ flex: 2, textAlign: "right" }}>{dec(g.google_rating)}</Text>
                      <Text style={{ flex: 2, textAlign: "right" }}>{g.nap_errors_count}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        <Text style={s.h2} minPresenceAhead={60}>Journal d&apos;activité</Text>
        {data.activity.length === 0 ? (
          <Empty>Aucune action enregistrée pour le moment.</Empty>
        ) : (
          <View style={s.table}>
            {data.activity.map((a, i) => (
              <View key={a.id} style={[s.tr, i === 0 ? { borderTopWidth: 0 } : {}, { alignItems: "flex-start" }]} wrap={false}>
                <Text style={[{ width: 62 }, s.muted]}>{date(a.created_at)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.bold}>{a.title}</Text>
                  {a.description && <Text style={[s.muted, { marginTop: 1 }]}>{a.description}</Text>}
                </View>
                <Text style={[{ width: 80, textAlign: "right", fontSize: 7 }, s.muted]}>{ACTIVITY_LABEL[a.category]}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>

      {/* ------------------------------------------------------------- Benchmark */}
      <Page size="A4" style={s.page}>
        <Chrome data={data} />
        <Text style={s.eyebrow}>2 · BENCHMARK IA & PROMPTS</Text>
        <Text style={s.h1}>Prompts métiers</Text>
        <Text style={s.lead}>
          Les questions que les clients posent aux IA génératives, et la présence de {company.name} dans les réponses de{" "}
          {engines.map((e) => ENGINE_LABELS[e]).join(" et ")}. « #1 » = citée en première position.
        </Text>

        <View style={s.kpis}>
          <Kpi label="Prompts suivis" value={String(data.prompts.length)} />
          <Kpi label="Prompts avec citation" value={`${citedSomewhere} / ${scanned.length}`} />
          <Kpi label="Taux de citation global" value={String(citationRate)} unit="%" />
          <Kpi label="Citée en 1re position" value={String(firstPlace)} />
        </View>

        <View style={[s.table, { marginTop: 14 }]}>
          <View style={s.th} fixed>
            <Text style={{ flex: 6 }}>{multiSite ? "PROMPT MÉTIER · CENTRE" : "PROMPT MÉTIER"}</Text>
            {engines.map((e) => (
              <Text key={e} style={{ flex: 1.6 }}>
                {ENGINE_LABELS[e].toUpperCase()}
              </Text>
            ))}
          </View>
          {prompts.map((p) => (
            <View key={p.id} style={s.tr} wrap={false}>
              <View style={{ flex: 6, paddingRight: 8 }}>
                <Text>{p.prompt_text}</Text>
                {multiSite && (
                  <Text style={[s.muted, { fontSize: 7, marginTop: 1 }]}>
                    {p.location_id ? locationName.get(p.location_id) ?? "" : "Question transverse"}
                  </Text>
                )}
              </View>
              {engines.map((e) => {
                const st = STATUS[p[`${e}_status`]];
                const pos = p[`${e}_position`];
                return (
                  <Text key={e} style={{ flex: 1.6, color: st.color }}>
                    {st.label}
                    {p[`${e}_status`] === "cited" && pos ? ` #${pos}` : ""}
                  </Text>
                );
              })}
            </View>
          ))}
          {prompts.length === 0 && (
            <View style={s.tr}>
              <Empty>Aucun prompt suivi pour le moment.</Empty>
            </View>
          )}
        </View>
      </Page>

      {/* ------------------------------------------------- Structure & Factualité */}
      <Page size="A4" style={s.page}>
        <Chrome data={data} />
        <Text style={s.eyebrow}>3 · STRUCTURE & FACTUALITÉ</Text>
        <Text style={s.h1}>Audit technique</Text>
        <Text style={s.lead}>Les 4 piliers qui permettent aux IA de comprendre, vérifier et recommander votre entreprise.</Text>

        <View style={s.kpis}>
          {data.pillars.map((p, i) => (
            <View key={p.label} style={s.kpi}>
              <Text style={s.kpiLabel}>
                Pilier {i + 1} · {p.label}
              </Text>
              <Text style={[s.kpiValue, { color: scoreColor(p.score) }]}>{p.score === null ? "—" : `${p.score} %`}</Text>
              <Text style={s.kpiNote}>{p.score === null ? "Audit à venir" : "de conformité"}</Text>
            </View>
          ))}
        </View>

        {(["schema", "llms_txt"] as const).map((pillar) => {
          const checks = data.checks.filter((c) => c.pillar === pillar);
          return (
            <View key={pillar}>
              <Text style={s.h2} minPresenceAhead={60}>{pillar === "schema" ? "Données structurées Schema.org" : "Fichier llms.txt"}</Text>
              {checks.length === 0 ? (
                <Empty>Audit en cours de réalisation.</Empty>
              ) : (
                <View style={s.table}>
                  {checks.map((c, i) => (
                    <View key={c.id} style={[s.tr, i === 0 ? { borderTopWidth: 0 } : {}, { alignItems: "flex-start" }]} wrap={false}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={s.bold}>{c.label}</Text>
                        {c.details && <Text style={[s.muted, { marginTop: 1 }]}>{c.details}</Text>}
                      </View>
                      <Pill {...CHECK[c.status]} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <Text style={s.h2} minPresenceAhead={60}>Alignement du signal NAP (Nom · Adresse · Téléphone)</Text>
        {nap.length === 0 ? (
          <Empty>Cartographie des citations en cours.</Empty>
        ) : (
          <View style={s.table}>
            <View style={s.th}>
              {multiSite && <Text style={{ flex: 3 }}>CENTRE</Text>}
              <Text style={{ flex: 3 }}>PLATEFORME</Text>
              <Text style={{ flex: 1, textAlign: "center" }}>NOM</Text>
              <Text style={{ flex: 1, textAlign: "center" }}>ADRESSE</Text>
              <Text style={{ flex: 1, textAlign: "center" }}>TÉL.</Text>
            </View>
            {nap.map((c) => {
              const ok = c.name_ok && c.address_ok && c.phone_ok;
              const cell = (v: boolean) => (
                <Text style={{ flex: 1, textAlign: "center", color: v ? C.green : C.red, fontFamily: "Helvetica-Bold" }}>
                  {v ? "OK" : "X"}
                </Text>
              );
              return (
                <View key={c.id} style={[s.tr, ok ? {} : { backgroundColor: "#fff1f2" }]} wrap={false}>
                  {multiSite && <Text style={[{ flex: 3 }, s.muted]}>{centre(c)}</Text>}
                  <Text style={{ flex: 3 }}>{c.platform}</Text>
                  {cell(c.name_ok)}
                  {cell(c.address_ok)}
                  {cell(c.phone_ok)}
                </View>
              );
            })}
          </View>
        )}

        <Text style={s.h2} minPresenceAhead={60}>Sentiment de marque</Text>
        {data.sentiment.length === 0 ? (
          <Empty>Analyse de sentiment en cours.</Empty>
        ) : (
          data.sentiment.map((snap) => (
            <View key={snap.id} style={{ marginBottom: 8 }} wrap={false}>
              <Text style={[s.bold, { marginBottom: 3 }]}>
                {snap.source === "google_reviews" ? "Avis clients (Google)" : "Réponses des IA"}
              </Text>
              <View style={[s.row, { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 3 }]}>
                <View style={{ width: `${Number(snap.positive_pct)}%`, backgroundColor: C.green }} />
                <View style={{ width: `${Number(snap.neutral_pct)}%`, backgroundColor: "#94a3b8" }} />
                <View style={{ width: `${Number(snap.critical_pct)}%`, backgroundColor: C.red }} />
              </View>
              <Text style={s.muted}>
                Positif {pct(snap.positive_pct)} · Neutre {pct(snap.neutral_pct)} · Critique {pct(snap.critical_pct)}
              </Text>
              {snap.summary && <Text style={[s.muted, { marginTop: 2 }]}>{snap.summary}</Text>}
            </View>
          ))
        )}
      </Page>
    </Document>
  );
}
