import type { Metadata } from "next";
import { Braces, FileCode2, MapPin, MessageCircleHeart } from "lucide-react";

import { CheckList } from "@/components/audit/check-list";
import { NapTable } from "@/components/audit/nap-table";
import { PillarCard } from "@/components/audit/pillar-card";
import { SentimentBars } from "@/components/audit/sentiment-bars";
import { LocationSelect } from "@/components/dashboard/location-select";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { getAuditData, getLocations, getSession } from "@/lib/data/queries";
import { isNapAligned, parseLocation } from "@/lib/locations";
import { formatDateLong } from "@/lib/utils";
import type { TechnicalCheck } from "@/types/database";

export const metadata: Metadata = { title: "Structure & Factualité" };

/** % de conformité : ok = 1, warning = 0,5, error/pending = 0 · null = pas encore audité. */
function checksScore(checks: TechnicalCheck[]) {
  if (checks.length === 0) return null;
  const points = checks.reduce((sum, c) => sum + (c.status === "ok" ? 1 : c.status === "warning" ? 0.5 : 0), 0);
  return Math.round((points / checks.length) * 100);
}

export default async function AuditTechniquePage({ searchParams }: { searchParams: { centre?: string } }) {
  const { company } = await getSession();
  const [{ checks, nap: allNap, sentiment }, locations] = await Promise.all([
    getAuditData(company.id),
    getLocations(company.id),
  ]);

  // Multi-sites : le pilier NAP se lit par centre (ou tous centres confondus).
  const location = parseLocation(searchParams.centre, locations);
  const nap = location ? allNap.filter((c) => c.location_id === location.id) : allNap;
  const locationNames = new Map(locations.map((l) => [l.id, l.name]));

  const schemaChecks = checks.filter((c) => c.pillar === "schema");
  const llmsChecks = checks.filter((c) => c.pillar === "llms_txt");

  const napFields = nap.flatMap((c) => [c.name_ok, c.address_ok, c.phone_ok]);
  const napScore = napFields.length ? Math.round((napFields.filter(Boolean).length / napFields.length) * 100) : null;
  const napMisaligned = nap.filter((c) => !isNapAligned(c)).length;

  const sentimentScore = sentiment.length
    ? Math.round(sentiment.reduce((sum, s) => sum + Number(s.positive_pct), 0) / sentiment.length)
    : null;

  const lastCheck = [...checks].sort((a, b) => b.checked_at.localeCompare(a.checked_at))[0]?.checked_at;

  return (
    <>
      <PageHeader
        eyebrow="Audit technique"
        title="Structure & Factualité"
        description="Les 4 piliers qui permettent aux IA de comprendre, vérifier et recommander votre entreprise."
        actions={
          <>
            {lastCheck && <Badge variant="outline">Dernier contrôle : {formatDateLong(lastCheck)}</Badge>}
            {locations.length > 0 && <LocationSelect locations={locations} value={location?.id ?? null} />}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <PillarCard
          index={1}
          title="Données structurées Schema.org"
          description="Balises JSON-LD qui décrivent votre activité aux moteurs et aux IA."
          icon={Braces}
          score={checksScore(schemaChecks)}
        >
          <CheckList checks={schemaChecks} />
        </PillarCard>

        <PillarCard
          index={2}
          title="Fichier llms.txt"
          description="Le « plan du site » dédié aux modèles de langage, à la racine du domaine."
          icon={FileCode2}
          score={checksScore(llmsChecks)}
        >
          <CheckList checks={llmsChecks} />
          {company.domain && (
            <p className="mt-3 text-xs text-muted-foreground">
              URL contrôlée :{" "}
              <a
                href={`https://${company.domain}/llms.txt`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-foreground hover:underline"
              >
                {company.domain}/llms.txt
              </a>
            </p>
          )}
        </PillarCard>

        <PillarCard
          index={3}
          title={location ? `Alignement du signal NAP · ${location.name}` : "Alignement du signal NAP"}
          description={
            nap.length === 0
              ? "Cohérence du Nom, de l'Adresse et du Téléphone sur les annuaires et plateformes clés."
              : napMisaligned === 0
              ? "Nom, Adresse et Téléphone identiques sur toutes les plateformes suivies."
              : `${napMisaligned} plateforme${napMisaligned > 1 ? "s" : ""} à corriger pour un signal NAP parfaitement cohérent.`
          }
          icon={MapPin}
          score={napScore}
        >
          <NapTable citations={nap} locationNames={location ? undefined : locationNames} />
        </PillarCard>

        <PillarCard
          index={4}
          title="Sentiment de marque"
          description="Tonalité des avis clients et de la façon dont les IA parlent de vous."
          icon={MessageCircleHeart}
          score={sentimentScore}
        >
          <SentimentBars snapshots={sentiment} />
        </PillarCard>
      </div>
    </>
  );
}
