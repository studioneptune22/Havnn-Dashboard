import type { Metadata } from "next";
import { Clapperboard, FileBarChart, FileSignature, FileSpreadsheet, FileText, Lock, Map, type LucideIcon } from "lucide-react";

import { DownloadButton } from "@/components/dashboard/download-button";
import { MonthlyRecapVideo } from "@/components/dashboard/monthly-recap-video";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCockpitData, getDocuments, getSession } from "@/lib/data/queries";
import { monthlyRecapSrc } from "@/lib/hyperframes";
import { formatBytes, formatDate } from "@/lib/utils";
import type { DocumentCategory } from "@/types/database";

export const metadata: Metadata = { title: "Documents & Rapports" };

const CATEGORY: Record<DocumentCategory, { label: string; icon: LucideIcon; format: string }> = {
  monthly_report: { label: "Rapport mensuel", icon: FileBarChart, format: "PDF" },
  roadmap: { label: "Feuille de route", icon: Map, format: "PDF" },
  contract: { label: "Contrat", icon: FileSignature, format: "PDF" },
  csv_export: { label: "Export CSV", icon: FileSpreadsheet, format: "CSV" },
  other: { label: "Document", icon: FileText, format: "—" },
};

const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export default async function RapportsPage() {
  const { company, demo } = await getSession();
  const [documents, cockpit] = await Promise.all([getDocuments(company.id), getCockpitData(company.id, "3m")]);
  const recapSrc = cockpit.latest
    ? monthlyRecapSrc({
        companyName: company.name,
        latest: cockpit.latest,
        previous: cockpit.previous,
        shareOfVoice: cockpit.shareOfVoice,
      })
    : null;

  const reports = documents.filter((d) => d.category === "monthly_report");
  const vault = documents.filter((d) => d.category !== "monthly_report");
  const [latestReport, ...olderReports] = reports;

  return (
    <>
      <PageHeader
        eyebrow="Espace documentaire"
        title="Documents & Rapports"
        description="Retrouvez vos rapports mensuels de performance GEO et l'ensemble des documents de votre accompagnement."
      />

      {/* ------------------------------------------------------ Bilan vidéo (HyperFrames) */}
      {recapSrc && (
        <section className="mb-4">
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="grid h-9 w-9 place-items-center rounded-lg border bg-background/50">
                <Clapperboard className="h-4 w-4 text-havnn-blue" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">Bilan vidéo du mois</CardTitle>
                <CardDescription>Vos résultats GEO en 17 secondes — à partager avec votre équipe.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <MonthlyRecapVideo src={recapSrc} className="mx-auto max-w-4xl" />
            </CardContent>
          </Card>
        </section>
      )}

      {/* ------------------------------------------------------ Rapports mensuels */}
      <section className="grid gap-4 lg:grid-cols-3">
        {latestReport ? (
          <Card className="relative overflow-hidden lg:col-span-1">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-havnn-blue/15 blur-3xl"
            />
            <CardHeader>
              <Badge variant="success" className="w-fit">Dernier rapport</Badge>
              <CardTitle className="pt-2 text-lg">{latestReport.title}</CardTitle>
              <CardDescription>
                Publié le {formatDate(latestReport.created_at)} · PDF · {formatBytes(latestReport.file_size)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 grid h-32 place-items-center rounded-lg border border-dashed bg-background/40">
                <FileBarChart className="h-10 w-10 text-havnn-blue/70" />
              </div>
              <DownloadButton href={latestReport.file_url} disabled={demo} label="Télécharger le rapport" />
            </CardContent>
          </Card>
        ) : (
          <Card className="grid place-items-center p-10 text-center text-sm text-muted-foreground lg:col-span-1">
            Votre premier rapport mensuel sera publié à la fin de votre premier mois d&apos;accompagnement.
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Historique des rapports mensuels</CardTitle>
            <CardDescription>Un rapport PDF est généré au début de chaque mois.</CardDescription>
          </CardHeader>
          <CardContent>
            {olderReports.length ? (
              <ul className="divide-y rounded-lg border">
                {olderReports.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 p-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border bg-background/50">
                      <FileBarChart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {r.period ? monthFmt.format(new Date(r.period)) : formatDate(r.created_at)} ·{" "}
                        {formatBytes(r.file_size)}
                      </p>
                    </div>
                    <DownloadButton href={r.file_url} disabled={demo} label="PDF" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucun rapport antérieur.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ------------------------------------------------------ Coffre-fort */}
      <section className="mt-4">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="grid h-9 w-9 place-items-center rounded-lg border bg-background/50">
              <Lock className="h-4 w-4 text-havnn-blue" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">Coffre-fort documentaire</CardTitle>
              <CardDescription>Feuille de route, contrats et exports de données — accès réservé à votre entreprise.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[260px]">Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Ajouté le</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vault.map((d) => {
                    const { label, icon: Icon, format } = CATEGORY[d.category];
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="font-medium">{d.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {label} · {format}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular">{formatBytes(d.file_size)}</TableCell>
                        <TableCell className="text-muted-foreground tabular">{formatDate(d.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DownloadButton href={d.file_url} disabled={demo} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {vault.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        Aucun document pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
