import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bot, Building2, History, MessageSquareText, Swords } from "lucide-react";

import { AutoScanToggle } from "@/components/admin/auto-scan-toggle";
import { BrandsForm } from "@/components/admin/brands-form";
import { ClientAccessForm } from "@/components/admin/client-access-form";
import { CompanyRowLink } from "@/components/admin/company-row-link";
import { JournalAdminList, JournalForm } from "@/components/admin/journal-admin";
import { NewCompanyForm } from "@/components/admin/new-company-form";
import { QuestionsForm } from "@/components/admin/questions-form";
import { ScanRunDetail, ScanRunsTable } from "@/components/admin/scan-runs";
import { PageHeader } from "@/components/dashboard/page-header";
import { AccountStatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCompetitors, formatQuestions } from "@/lib/admin/parse";
import { getAdminClientData, getClientsOverview } from "@/lib/data/admin";
import { getSession } from "@/lib/data/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Administration" };

const TABS = [
  { value: "clients", label: "Clients", icon: Building2 },
  { value: "journal", label: "Journal", icon: History },
  { value: "questions", label: "Questions", icon: MessageSquareText },
  { value: "concurrents", label: "Concurrents", icon: Swords },
  { value: "releve", label: "Relevé auto", icon: Bot },
] as const;

export default async function AdminPage({ searchParams }: { searchParams: { onglet?: string } }) {
  const { company, admin } = await getSession();
  if (!admin) notFound();

  const [overview, data] = await Promise.all([getClientsOverview(), getAdminClientData(company.id)]);
  const tab = TABS.some((t) => t.value === searchParams.onglet) ? searchParams.onglet : "clients";
  const client = data.brands.find((b) => b.is_client);
  const competitors = data.brands.filter((b) => !b.is_client);
  const cockpitScore = overview.find((o) => o.company.id === company.id)?.score ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Vue HAVNN"
        title="Administration"
        description={`Client actif : ${company.name}. Les onglets Journal, Questions, Concurrents et Relevé auto s'appliquent à ce client ; changez-le dans la barre latérale ou dans le tableau des clients.`}
      />

      <Tabs defaultValue={tab}>
        <TabsList className="mb-6 h-auto flex-wrap justify-start">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ------------------------------------------------------------ Clients */}
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tous les clients</CardTitle>
              <CardDescription>Cliquez sur un client pour l&apos;afficher dans tout le portail.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Dernier relevé</TableHead>
                    <TableHead className="text-right">Questions</TableHead>
                    <TableHead>Relevé auto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.map((o) => (
                    <TableRow key={o.company.id} className={o.company.id === company.id ? "bg-havnn-blue/5" : undefined}>
                      <TableCell>
                        <CompanyRowLink id={o.company.id} active={o.company.id === company.id}>
                          {o.company.name}
                        </CompanyRowLink>
                        <div className="text-xs text-muted-foreground">{o.company.domain ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        <AccountStatusBadge status={o.company.plan_status} />
                      </TableCell>
                      <TableCell className="text-right">{o.score === null ? "—" : `${Math.round(o.score)} %`}</TableCell>
                      <TableCell className="whitespace-nowrap">{o.scoredAt ? formatDate(o.scoredAt) : "—"}</TableCell>
                      <TableCell className="text-right">{o.questions}</TableCell>
                      <TableCell>
                        {o.company.auto_scan ? (
                          <Badge variant="success">Activé</Badge>
                        ) : (
                          <Badge variant="outline">Non</Badge>
                        )}
                        {o.lastRun && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {o.lastRun.mode === "live" ? "Publié" : "Test"} le {formatDate(o.lastRun.created_at)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Nouveau client</CardTitle>
                <CardDescription>Le client créé devient le client actif.</CardDescription>
              </CardHeader>
              <CardContent>
                <NewCompanyForm />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Accès au portail · {company.name}</CardTitle>
                <CardDescription>
                  {data.accounts.length
                    ? `Comptes rattachés : ${data.accounts.map((a) => a.full_name ? `${a.full_name} (${a.email})` : a.email).join(", ")}.`
                    : "Aucun compte de connexion pour ce client."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientAccessForm companyId={company.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------ Journal */}
        <TabsContent value="journal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une action · {company.name}</CardTitle>
              <CardDescription>L&apos;entrée apparaît aussitôt dans le journal d&apos;activité du client.</CardDescription>
            </CardHeader>
            <CardContent>
              <JournalForm companyId={company.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dernières entrées</CardTitle>
              <CardDescription>Les 30 plus récentes. La corbeille supprime définitivement une entrée.</CardDescription>
            </CardHeader>
            <CardContent>
              <JournalAdminList companyId={company.id} items={data.activity} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------- Questions */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Questions suivies · {company.name}</CardTitle>
              <CardDescription>
                Les questions posées chaque semaine à ChatGPT et Gemini. Les résultats existants sont conservés pour les questions
                inchangées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionsForm
                key={company.id}
                companyId={company.id}
                initial={formatQuestions(data.prompts, data.locations)}
                multiSite={data.locations.length > 0}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------------------------------------------- Concurrents */}
        <TabsContent value="concurrents">
          <Card>
            <CardHeader>
              <CardTitle>Marques reconnues · {company.name}</CardTitle>
              <CardDescription>
                Le relevé automatique repère ces noms dans les réponses des IA pour calculer la part de voix. Ajoutez les variantes
                sous lesquelles les IA écrivent le nom (sigle, ancien nom, nom commercial…).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandsForm
                key={company.id}
                companyId={company.id}
                clientName={client?.name ?? company.name}
                clientAliases={client?.aliases.join(", ") ?? ""}
                competitors={formatCompetitors(competitors)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------------------------------------------- Relevé auto */}
        <TabsContent value="releve" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relevé automatique · {company.name}</CardTitle>
              <CardDescription>
                Chaque lundi matin, le robot pose les {data.prompts.length} questions suivies à ChatGPT et Gemini. En mode test,
                les résultats s&apos;affichent ici seulement, pour les comparer au relevé manuel ; en mode publié, ils mettent à jour
                le Cockpit du client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {company.auto_scan ? <Badge variant="success">Inclus dans le relevé</Badge> : <Badge variant="outline">Non inclus</Badge>}
                {!client && <Badge variant="warning">Marque client à définir (onglet Concurrents)</Badge>}
                {data.prompts.length === 0 && <Badge variant="warning">Aucune question suivie</Badge>}
              </div>
              <AutoScanToggle companyId={company.id} enabled={Boolean(company.auto_scan)} />
              <ScanRunsTable runs={data.runs} />
            </CardContent>
          </Card>

          {data.latestRun && (
            <Card>
              <CardHeader>
                <CardTitle>Dernier relevé</CardTitle>
                <CardDescription>
                  {data.latestRun.mode === "test" ? "Relevé de test : le Cockpit du client n'a pas été modifié." : "Relevé publié dans le Cockpit."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScanRunDetail run={data.latestRun} cockpitScore={cockpitScore} prompts={data.prompts} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
