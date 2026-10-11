"use server";

import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  journalTimestamp,
  normalizeDomain,
  parseAliases,
  parseCompetitors,
  parseQuestions,
} from "@/lib/admin/parse";
import { ADMIN_COMPANY_COOKIE } from "@/lib/data/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ActivityCategory } from "@/types/database";

/**
 * Actions de la vue admin. Chacune vérifie côté serveur que l'utilisateur connecté est
 * un consultant HAVNN, puis écrit avec la clé service_role (aucune écriture possible
 * depuis le navigateur : le RLS reste en lecture seule).
 */

export interface ActionState {
  ok?: string;
  error?: string;
  /** Mot de passe provisoire, affiché une seule fois (à transmettre par SMS). */
  password?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORIES: ActivityCategory[] = ["schema", "nap", "content", "reviews", "llms_txt", "report", "monitoring", "seo", "other"];
const PLAN_STATUSES = ["onboarding", "active", "paused"] as const;

class AdminError extends Error {}

/** Vérifie que l'utilisateur connecté est un consultant HAVNN ; renvoie son client Supabase (RLS admin). */
async function checkAdmin() {
  if (!isSupabaseConfigured) throw new AdminError("Indisponible en mode démo.");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AdminError("Session expirée : reconnectez-vous.");
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "havnn_admin") throw new AdminError("Action réservée aux consultants HAVNN.");
  return supabase;
}

/** Admin vérifié → client service_role pour écrire (le RLS n'autorise aucune écriture). */
async function requireAdmin() {
  await checkAdmin();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AdminError("Clé SUPABASE_SERVICE_ROLE_KEY absente de Vercel : ajoutez-la puis redéployez.");
  }
  return createAdminClient();
}

const text = (fd: FormData, key: string, max = 4000) => String(fd.get(key) ?? "").trim().slice(0, max);

function companyIdFrom(fd: FormData) {
  const id = text(fd, "company_id", 64);
  if (!UUID_RE.test(id)) throw new AdminError("Client introuvable.");
  return id;
}

/** Exécute une action et transforme les erreurs en message affiché sous le formulaire. */
async function run(fn: () => Promise<string | ActionState>): Promise<ActionState> {
  try {
    const result = await fn();
    revalidatePath("/dashboard", "layout");
    return typeof result === "string" ? { ok: result } : result;
  } catch (e) {
    if (e instanceof AdminError) return { error: e.message };
    console.error("[admin]", e);
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

function setActiveCompany(id: string) {
  cookies().set(ADMIN_COMPANY_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

// ------------------------------------------------------------------ Client actif
export async function switchCompany(formData: FormData): Promise<ActionState> {
  try {
    // Lecture seule : le compte admin suffit (le RLS lui ouvre toutes les entreprises).
    const supabase = await checkAdmin();
    const id = companyIdFrom(formData);
    const { data } = await supabase.from("companies").select("id").eq("id", id).maybeSingle();
    if (!data) throw new AdminError("Client introuvable.");
    setActiveCompany(id);
    revalidatePath("/dashboard", "layout");
    return {};
  } catch (e) {
    console.error("[admin] switchCompany", e);
    return { error: e instanceof AdminError ? e.message : "Impossible de changer de client." };
  }
}

// --------------------------------------------------------------- Nouveau client
export async function createCompany(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return run(async () => {
    const db = await requireAdmin();
    const name = text(formData, "name", 120);
    if (!name) throw new AdminError("Le nom du client est obligatoire.");
    const domain = normalizeDomain(text(formData, "domain", 200));
    if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new AdminError(`Site web invalide : « ${domain} ».`);
    const planStatus = text(formData, "plan_status", 20);

    const { data, error } = await db
      .from("companies")
      .insert({
        name,
        domain,
        city: text(formData, "city", 120) || null,
        sector: text(formData, "sector", 160) || null,
        plan_status: PLAN_STATUSES.includes(planStatus as (typeof PLAN_STATUSES)[number]) ? planStatus : "onboarding",
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new AdminError(`Un client utilise déjà le site ${domain}.`);
      throw new Error(error.message);
    }

    // La marque du client, reconnue dans les réponses des IA (variantes à compléter).
    await db.from("tracked_brands").insert({ company_id: data.id, name, is_client: true, sort_order: 0 });
    setActiveCompany(data.id);
    return `${name} est créé et affiché dans le portail. Ajoutez maintenant ses questions et ses concurrents.`;
  });
}

// ----------------------------------------------------------------------- Journal
export async function addActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return run(async () => {
    const db = await requireAdmin();
    const companyId = companyIdFrom(formData);
    const title = text(formData, "title", 200);
    if (!title) throw new AdminError("Le titre est obligatoire.");
    const category = text(formData, "category", 20) as ActivityCategory;
    if (!CATEGORIES.includes(category)) throw new AdminError("Catégorie inconnue.");
    const createdAt = journalTimestamp(text(formData, "date", 10));
    if (!createdAt) throw new AdminError("Date invalide (pas de date future).");

    const { error } = await db.from("activity_logs").insert({
      company_id: companyId,
      title,
      description: text(formData, "description") || null,
      category,
      created_at: createdAt,
    });
    if (error) throw new Error(error.message);
    return `« ${title} » est ajouté au journal.`;
  });
}

export async function deleteActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return run(async () => {
    const db = await requireAdmin();
    const companyId = companyIdFrom(formData);
    const id = text(formData, "id", 64);
    if (!UUID_RE.test(id)) throw new AdminError("Entrée introuvable.");
    const { error, count } = await db
      .from("activity_logs")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
    if (!count) throw new AdminError("Entrée déjà supprimée.");
    return "Entrée supprimée du journal.";
  });
}

// --------------------------------------------------------------------- Questions
export async function saveQuestions(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return run(async () => {
    const db = await requireAdmin();
    const companyId = companyIdFrom(formData);

    const [{ data: locations }, { data: current, error: readError }] = await Promise.all([
      db.from("locations").select("id, name").eq("company_id", companyId),
      db.from("prompts_latest").select("prompt_text, location_id").eq("company_id", companyId),
    ]);
    if (readError) throw new Error(readError.message);

    const { questions, errors } = parseQuestions(text(formData, "questions", 60_000), locations ?? []);
    if (errors.length) throw new AdminError(errors.join(" "));

    const existing = new Map((current ?? []).map((p) => [p.prompt_text as string, p.location_id as string | null]));
    const wanted = new Map(questions.map((q) => [q.text, q.locationId]));
    const removed = Array.from(existing.keys()).filter((q) => !wanted.has(q));
    const added = questions.filter((q) => !existing.has(q.text));
    const moved = questions.filter((q) => existing.has(q.text) && existing.get(q.text) !== q.locationId);

    if (removed.length) {
      const { error } = await db.from("prompts_monitoring").delete().eq("company_id", companyId).in("prompt_text", removed);
      if (error) throw new Error(error.message);
    }
    for (const q of moved) {
      const { error } = await db
        .from("prompts_monitoring")
        .update({ location_id: q.locationId })
        .eq("company_id", companyId)
        .eq("prompt_text", q.text);
      if (error) throw new Error(error.message);
    }
    if (added.length) {
      // Nouvelle question : « en attente » jusqu'au prochain relevé.
      const { error } = await db.from("prompts_monitoring").insert(
        added.map((q) => ({ company_id: companyId, prompt_text: q.text, location_id: q.locationId })),
      );
      if (error) throw new Error(error.message);
    }

    if (!removed.length && !added.length && !moved.length) return "Aucun changement.";
    const parts = [
      added.length && `${added.length} ajoutée${added.length > 1 ? "s" : ""}`,
      removed.length && `${removed.length} retirée${removed.length > 1 ? "s" : ""}`,
      moved.length && `${moved.length} rattachée${moved.length > 1 ? "s" : ""} à un autre centre`,
    ].filter(Boolean);
    return `Questions enregistrées : ${parts.join(", ")} (${questions.length} suivies).`;
  });
}

// -------------------------------------------------------- Concurrents & variantes
export async function saveBrands(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return run(async () => {
    const db = await requireAdmin();
    const companyId = companyIdFrom(formData);
    const clientName = text(formData, "client_name", 120);
    if (!clientName) throw new AdminError("Le nom du client est obligatoire.");
    const { brands, errors } = parseCompetitors(text(formData, "competitors", 20_000));
    if (errors.length) throw new AdminError(errors.join(" "));
    if (brands.some((b) => b.name.toLowerCase() === clientName.toLowerCase())) {
      throw new AdminError(`« ${clientName} » est à la fois le client et un concurrent.`);
    }

    const rows = [
      { name: clientName, aliases: parseAliases(text(formData, "client_aliases", 2000), clientName), is_client: true },
      ...brands.map((b) => ({ ...b, is_client: false })),
    ].map((b, i) => ({ company_id: companyId, ...b, sort_order: i }));

    // Remplacement complet : la liste saisie fait foi.
    const { error: delError } = await db.from("tracked_brands").delete().eq("company_id", companyId);
    if (delError) throw new Error(delError.message);
    const { error } = await db.from("tracked_brands").insert(rows);
    if (error) throw new Error(error.message);
    return `Marques enregistrées : le client et ${brands.length} concurrent${brands.length > 1 ? "s" : ""}.`;
  });
}

// ------------------------------------------------------------------ Relevé auto
export async function setAutoScan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return run(async () => {
    const db = await requireAdmin();
    const companyId = companyIdFrom(formData);
    const enabled = formData.get("enabled") === "true";
    const { error } = await db.from("companies").update({ auto_scan: enabled }).eq("id", companyId);
    if (error) throw new Error(error.message);
    return enabled ? "Client inclus dans le relevé automatique du lundi." : "Client retiré du relevé automatique.";
  });
}

// ----------------------------------------------------------------- Accès client
/** Mot de passe provisoire lisible (sans 0/O, 1/l/I) : 4 groupes de 4 caractères. */
function provisionalPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join("")).join("-");
}

/** Identifiant de connexion Supabase d'une adresse email (parcours des comptes, 1 000 par page). */
async function findAuthUserId(db: ReturnType<typeof createAdminClient>, email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 1000) return undefined;
  }
  return undefined;
}

export async function createClientAccess(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return run(async () => {
    const db = await requireAdmin();
    const companyId = companyIdFrom(formData);
    const email = text(formData, "email", 200).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AdminError("Adresse email invalide.");
    const fullName = text(formData, "full_name", 120) || null;

    const { data: profile } = await db.from("users").select("id, role, company_id").eq("email", email).maybeSingle();
    if (profile?.role === "havnn_admin") throw new AdminError("Ce compte est un compte HAVNN : il voit déjà tous les clients.");
    if (profile?.company_id === companyId) throw new AdminError(`${email} a déjà accès à ce client.`);
    if (profile?.company_id) {
      const { data: other } = await db.from("companies").select("name").eq("id", profile.company_id).maybeSingle();
      throw new AdminError(`${email} est déjà rattaché à ${other?.name ?? "un autre client"} : un compte ne voit qu'un seul client.`);
    }

    let userId = profile?.id as string | undefined;
    let password: string | undefined;
    if (!userId) {
      password = provisionalPassword();
      const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
      if (error && !/already|registered|exists/i.test(error.message)) throw new Error(error.message);
      if (error) {
        // Compte de connexion créé auparavant (Supabase, essai précédent) mais jamais rattaché :
        // on le retrouve et on lui donne un nouveau mot de passe provisoire.
        userId = await findAuthUserId(db, email);
        if (!userId) throw new Error(error.message);
        const { error: updateError } = await db.auth.admin.updateUserById(userId, { password, email_confirm: true });
        if (updateError) throw new Error(updateError.message);
      } else {
        userId = data.user.id;
      }
    }

    const { error } = await db
      .from("users")
      .upsert({ id: userId, company_id: companyId, email, full_name: fullName, role: "client" }, { onConflict: "id" });
    if (error) throw new Error(error.message);

    return password
      ? { ok: `Compte créé pour ${email}. Envoyez-lui le mot de passe provisoire par SMS.`, password }
      : { ok: `${email} existait déjà : il est maintenant rattaché à ce client (mot de passe inchangé).` };
  });
}
