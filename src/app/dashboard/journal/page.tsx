import type { Metadata } from "next";

import { ActivityJournal } from "@/components/dashboard/activity-journal";
import { PageHeader } from "@/components/dashboard/page-header";
import { getActivity, getSession } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Journal d'activité" };

/** Plafond de lecture Supabase par requête : largement au-dessus d'une année d'accompagnement. */
const MAX_ACTIONS = 1000;

export default async function JournalPage() {
  const { company } = await getSession();
  const activity = await getActivity(company.id, MAX_ACTIONS);

  return (
    <>
      <PageHeader
        eyebrow="Suivi de mission"
        title="Journal d'activité"
        description="Toutes les actions réalisées par HAVNN depuis le début de l'accompagnement, mois par mois."
      />
      <ActivityJournal items={activity} />
    </>
  );
}
