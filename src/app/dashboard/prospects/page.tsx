import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheck, Gauge, UserPlus } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { getProspects, getSession, isAdmin } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Prospects" };

export default async function ProspectsPage() {
  const session = await getSession();
  if (!isAdmin(session)) notFound();

  const prospects = await getProspects();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = prospects.filter((p) => new Date(p.created_at) >= monthStart);
  const average = prospects.length ? Math.round(prospects.reduce((s, p) => s + p.score, 0) / prospects.length) : null;
  const booked = prospects.filter((p) => p.statut === "audit_reserve" || p.statut === "client").length;
  const toCall = prospects.filter((p) => p.statut === "nouveau").length;

  return (
    <>
      <PageHeader
        eyebrow="Équipe Havnn"
        title="Prospects"
        description="Les entreprises qui ont fait le test de visibilité IA sur havnn.fr, du plus récent au plus ancien."
      />

      <section className="mb-4 grid gap-4 sm:grid-cols-3">
        <KpiCard title="Tests ce mois-ci" icon={UserPlus} footer={<p className="text-xs text-muted-foreground">{toCall} à rappeler</p>}>
          <p className="text-3xl font-semibold tabular">{thisMonth.length}</p>
        </KpiCard>
        <KpiCard title="Note moyenne" icon={Gauge} footer={<p className="text-xs text-muted-foreground">Sur {prospects.length} tests</p>}>
          <p className="text-3xl font-semibold tabular">
            {average ?? "—"}
            <span className="text-base font-normal text-muted-foreground"> / 100</span>
          </p>
        </KpiCard>
        <KpiCard title="Audits réservés" icon={CalendarCheck} footer={<p className="text-xs text-muted-foreground">Audits réservés et clients</p>}>
          <p className="text-3xl font-semibold tabular">{booked}</p>
        </KpiCard>
      </section>

      <ProspectsTable prospects={prospects} demo={session.demo} />
    </>
  );
}
