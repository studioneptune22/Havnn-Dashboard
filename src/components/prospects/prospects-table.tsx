"use client";

import { Fragment, useState, useTransition } from "react";
import { ChevronDown, ExternalLink, Mail, Phone } from "lucide-react";

import { updateProspectStatus } from "@/app/dashboard/prospects/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDateTime } from "@/lib/utils";
import type { Prospect, ProspectStatus } from "@/types/database";

const STATUS_LABEL: Record<ProspectStatus, string> = {
  nouveau: "Nouveau",
  rappele: "Rappelé",
  audit_reserve: "Audit réservé",
  client: "Client",
  pas_interesse: "Pas intéressé",
};

function scoreVariant(score: number) {
  if (score >= 70) return "success" as const;
  if (score >= 40) return "warning" as const;
  return "danger" as const;
}

function StatusSelect({ prospect, demo }: { prospect: Prospect; demo: boolean }) {
  const [value, setValue] = useState<ProspectStatus>(prospect.statut);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <select
        aria-label={`Statut de ${prospect.entreprise}`}
        value={value}
        disabled={pending}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const next = e.target.value as ProspectStatus;
          const previous = value;
          setValue(next);
          setError(undefined);
          startTransition(async () => {
            const res = await updateProspectStatus(prospect.id, next);
            if (res.error) {
              setValue(previous);
              setError(res.error);
            }
          });
        }}
        className="h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-havnn-blue disabled:opacity-60"
      >
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {demo && value !== prospect.statut && <p className="text-xs text-muted-foreground">Démo : non enregistré</p>}
    </div>
  );
}

function ProspectDetail({ prospect }: { prospect: Prospect }) {
  const { rapport } = prospect;
  const competitors = rapport.ia?.competitors ?? [];
  const utm = prospect.utm ? Object.entries(prospect.utm) : [];

  return (
    <div className="grid gap-6 p-4 md:grid-cols-3">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Les 3 volets</p>
        {rapport.volets.map((v) => (
          <div key={v.id}>
            <div className="flex justify-between gap-3 text-sm">
              <span>{v.label}</span>
              <span className="whitespace-nowrap tabular text-muted-foreground">{v.available ? `${v.points} / ${v.max}` : "non testé"}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-secondary">
              <div
                className="h-1.5 rounded-full bg-havnn-blue"
                style={{ width: v.available && v.max ? `${Math.round((v.points / v.max) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Par où commencer</p>
        <ol className="list-decimal space-y-2 pl-4 text-sm">
          {rapport.priorities.map((p) => (
            <li key={p.id}>
              <span className="font-medium">{p.label}</span>
              {p.fix && <span className="block text-muted-foreground">{p.fix}</span>}
            </li>
          ))}
          {rapport.priorities.length === 0 && <li className="text-muted-foreground">Rien d&apos;urgent.</li>}
        </ol>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Cités à sa place</p>
          {competitors.length ? (
            <ul className="space-y-1">
              {competitors.map((c) => (
                <li key={c.name} className="flex justify-between gap-2">
                  <span>{c.name}</span>
                  <span className="tabular text-muted-foreground">{c.count} / 6</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Aucun concurrent relevé.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="inline-flex items-center gap-1 text-havnn-blue hover:underline" href={`tel:${prospect.telephone.replace(/\s/g, "")}`}>
            <Phone className="h-3.5 w-3.5" /> {prospect.telephone}
          </a>
          <a className="inline-flex items-center gap-1 text-havnn-blue hover:underline" href={`mailto:${prospect.email}`}>
            <Mail className="h-3.5 w-3.5" /> {prospect.email}
          </a>
          <a className="inline-flex items-center gap-1 text-havnn-blue hover:underline" href={prospect.site} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Site
          </a>
        </div>
        {utm.length > 0 && (
          <p className="text-xs text-muted-foreground">Provenance : {utm.map(([k, v]) => `${k.replace("utm_", "")} ${v}`).join(" · ")}</p>
        )}
      </div>
    </div>
  );
}

export function ProspectsTable({ prospects, demo }: { prospects: Prospect[]; demo: boolean }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tests reçus</CardTitle>
        <CardDescription>Cliquez sur une ligne pour voir le détail du rapport envoyé.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead className="min-w-[200px]">Entreprise</TableHead>
                <TableHead className="min-w-[180px]">Contact</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospects.map((p) => {
                const isOpen = open === p.id;
                return (
                  <Fragment key={p.id}>
                    <TableRow
                      className="cursor-pointer"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : p.id)}
                    >
                      <TableCell className="whitespace-nowrap text-muted-foreground tabular">{formatDateTime(p.created_at)}</TableCell>
                      <TableCell>
                        <p className="font-medium">{p.entreprise}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.metier} · {p.ville}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>
                          {p.prenom} {p.nom}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.telephone}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={scoreVariant(p.score)} className="tabular">
                          {p.score} / 100
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusSelect prospect={p} demo={demo} />
                      </TableCell>
                      <TableCell>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="bg-background/40 p-0">
                          <ProspectDetail prospect={p} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
              {prospects.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun test pour le moment. Ils apparaîtront ici dès le premier test fait sur havnn.fr.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
