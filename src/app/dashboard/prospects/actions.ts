"use server";

import { revalidatePath } from "next/cache";

import { getSession, isAdmin } from "@/lib/data/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ProspectStatus } from "@/types/database";

const STATUSES: ProspectStatus[] = ["nouveau", "rappele", "audit_reserve", "client", "pas_interesse"];

export async function updateProspectStatus(id: string, statut: ProspectStatus): Promise<{ error?: string }> {
  if (!STATUSES.includes(statut)) return { error: "Statut inconnu." };
  const session = await getSession();
  if (!isAdmin(session)) return { error: "Accès réservé à l'équipe Havnn." };
  if (!isSupabaseConfigured) return {}; // mode démo : rien n'est enregistré

  const supabase = createClient();
  const { error } = await supabase.from("tests_visibilite_ia").update({ statut }).eq("id", id);
  if (error) return { error: "Le statut n'a pas pu être enregistré." };

  revalidatePath("/dashboard/prospects");
  return {};
}
