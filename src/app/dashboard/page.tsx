import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Gauge, MapPinOff, Star } from "lucide-react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ACTIVE_ENGINES, ENGINE_COLORS, ENGINE_LABELS } from "@/components/dashboard/chart-theme";
import { DeltaBadge } from "@/components/dashboard/delta-badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LocationsCard } from "@/components/dashboard/locations-card";
import { PeriodSelect } from "@/components/dashboard/period-select";
import { ScoreGauge } from "@/components/dashboard/score-gauge";
import { ScoreTrendChart } from "@/components/dashboard/score-trend-chart";
import { ShareOfVoiceChart } from "@/components/dashboard/share-of-voice-chart";
import { AccountStatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { parsePeriod } from "@/lib/data/period";
import { getCockpitData, getLocations, getNapCitations, getSession } from "@/lib/data/queries";
import { groupGoogleRating } from "@/lib/locations";
import { delta, formatDateLong } from "@/lib/utils";
import type { ShareOfVoice } from "@/types/database";

export const metadata: Metadata = { title: "Cockpit" };

const mentions = (b: ShareOfVoice) => ACTIVE_ENGINES.reduce((sum, e) => sum + b[`${e}_mentions`], 0);

export default async function CockpitPage({ searchParams }: { searchParams: { period?: string } }) {
  const period = parsePeriod(searchParams.period);
  const { company } = await getSession();
  const [{ scores, latest, previous, shareOfVoice, activity }, locations] = await Promise.all([
    getCockpitData(company.id, period),
    getLocations(company.id),
  ]);
  const multiSite = locations.length > 0;
  const nap = multiSite ? await getNapCitations(company.id) : [];

  // Multi-sites : la note Google affichée est celle du groupe (moyenne pondérée par les avis).
  const group = groupGoogleRating(locations);
  const googleRating = multiSite ? group.rating : latest?.google_rating ?? null;
  const googleReviews = multiSite ? group.reviews : latest?.google_reviews_total ?? 0;

  const client = shareOfVoice.find((b) => b.is_client);
  const totalMentions = shareOfVoice.reduce((sum, b) => sum + mentions(b), 0);
  const clientMentions = client ? mentions(client) : 0;
  const clientShare = totalMentions ? Math.round((clientMentions / totalMentions) * 100) : 0;
  const initialNapErrors = scores[0]?.nap_errors_count ?? latest?.nap_errors_count ?? 0;

  return (
    <>
      {/* ---------------------------------------------------------------- Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-havnn-blue">Cockpit GEO</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{company.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[company.sector, multiSite ? `${locations.length} centres` : company.city].filter(Boolean).join(" · ")}
            {latest && <> · Dernière mise à jour le {formatDateLong(latest.recorded_at)}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AccountStatusBadge status={company.plan_status} />
          <PeriodSelect value={period} />
        </div>
      </div>

      {!latest ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Vos premières données seront disponibles après le scan initial (sous 7 jours).
        </Card>
      ) : (
        <>
          {/* ------------------------------------------------------------ KPIs */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Score de Dominance GEO"
              icon={Gauge}
              footer={<DeltaBadge value={delta(latest.score_percentage, previous?.score_percentage)} />}
            >
              <ScoreGauge value={Number(latest.score_percentage)} size={170} />
            </KpiCard>

            <KpiCard
              title="Taux de Présence IA"
              icon={Bot}
              footer={<DeltaBadge value={delta(latest.ai_presence_rate, previous?.ai_presence_rate)} />}
            >
              <div className="text-4xl font-semibold tracking-tight tabular">
                {Math.round(Number(latest.ai_presence_rate))}
                <span className="text-xl text-muted-foreground">%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">des requêtes avec la marque dans le Top 3</p>
              <div className="mt-4 space-y-2">
                {ACTIVE_ENGINES.map((engine) => {
                  const rate = latest[`${engine}_presence_rate`];
                  if (rate === null) return null;
                  return (
                    <div key={engine} className="grid grid-cols-[72px_1fr_36px] items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{ENGINE_LABELS[engine]}</span>
                      <Progress value={Number(rate)} className="h-1.5" indicatorClassName="bg-[var(--c)]" style={{ ["--c" as string]: ENGINE_COLORS[engine] }} />
                      <span className="text-right tabular">{Math.round(Number(rate))}%</span>
                    </div>
                  );
                })}
              </div>
            </KpiCard>

            <KpiCard
              title="Note Google & Fiche GMB"
              icon={Star}
              footer={
                <DeltaBadge
                  value={latest.google_reviews_new ?? 0}
                  unit=" avis"
                  suffix="capturés ce mois"
                />
              }
            >
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight tabular">
                  {googleRating?.toLocaleString("fr-FR", { minimumFractionDigits: 1 }) ?? "—"}
                </span>
                <span className="text-xl text-muted-foreground">/ 5</span>
              </div>
              <div className="mt-2 flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < Math.round(googleRating ?? 0)
                        ? "h-4 w-4 fill-amber-400 text-amber-400"
                        : "h-4 w-4 text-havnn-line"
                    }
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground tabular">{googleReviews}</span> avis au total sur{" "}
                {multiSite
                  ? `vos ${group.rated} fiche${group.rated > 1 ? "s" : ""} Google (moyenne pondérée)`
                  : "votre fiche Google Business Profile"}
              </p>
            </KpiCard>

            <KpiCard
              title="Incohérences NAP détectées"
              icon={MapPinOff}
              footer={
                <DeltaBadge
                  value={latest.nap_errors_count - (previous?.nap_errors_count ?? latest.nap_errors_count)}
                  unit=""
                  invert
                />
              }
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={
                    latest.nap_errors_count === 0
                      ? "text-4xl font-semibold tracking-tight text-emerald-400 tabular"
                      : "text-4xl font-semibold tracking-tight tabular"
                  }
                >
                  {latest.nap_errors_count}
                </span>
                <span className="text-sm text-muted-foreground">erreur{latest.nap_errors_count > 1 ? "s" : ""} restante{latest.nap_errors_count > 1 ? "s" : ""}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Objectif : 0 incohérence Nom / Adresse / Tél.</p>
              {initialNapErrors > 0 && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Corrigées sur la période</span>
                    <span className="tabular">
                      {initialNapErrors - latest.nap_errors_count} / {initialNapErrors}
                    </span>
                  </div>
                  <Progress
                    value={((initialNapErrors - latest.nap_errors_count) / initialNapErrors) * 100}
                    className="h-1.5"
                    indicatorClassName="bg-havnn-emerald"
                  />
                </div>
              )}
            </KpiCard>
          </section>

          {/* ---------------------------------------------- Part de voix + journal */}
          <section className="mt-4 grid gap-4 xl:grid-cols-3">
            <Card className="min-w-0 xl:col-span-2">
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Part de Voix IA</CardTitle>
                  <CardDescription>
                    Nombre de prompts clés (sur {shareOfVoice[0]?.prompts_total ?? 20}) où chaque marque est citée,
                    par moteur.
                  </CardDescription>
                </div>
                {client && (
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-emerald-400 tabular">{clientShare}%</div>
                    <div className="text-xs text-muted-foreground">de part de voix</div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {shareOfVoice.length ? (
                  <ShareOfVoiceChart data={shareOfVoice} />
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">Benchmark concurrentiel en préparation.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Journal d&apos;activité</CardTitle>
                  <CardDescription>Dernières actions réalisées par HAVNN</CardDescription>
                </div>
                <Link
                  href="/dashboard/journal"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-havnn-blue hover:underline"
                >
                  Tout voir <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                <ActivityFeed items={activity} />
              </CardContent>
            </Card>
          </section>

          {multiSite && (
            <section className="mt-4">
              <LocationsCard locations={locations} nap={nap} />
            </section>
          )}

          {/* ---------------------------------------------------- Évolution */}
          <section className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Évolution de la dominance GEO</CardTitle>
                <CardDescription>Score de Dominance et Taux de Présence IA sur la période sélectionnée.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoreTrendChart data={scores} />
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </>
  );
}
