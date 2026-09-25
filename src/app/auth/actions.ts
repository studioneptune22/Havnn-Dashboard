"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

/** Ne redirige que vers un chemin interne (évite les open redirects). */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/dashboard") ? next : "/dashboard";
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const next = safeNext(formData.get("next"));

  if (!isSupabaseConfigured) redirect(next); // mode démo

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Merci de renseigner votre email et votre mot de passe." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Identifiants incorrects. Vérifiez votre email et votre mot de passe." };

  redirect(next);
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
