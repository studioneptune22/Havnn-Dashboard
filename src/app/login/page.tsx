import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { HavnnLogo } from "@/components/layout/logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Connexion" };

const ERRORS: Record<string, string> = {
  no_company: "Votre compte n'est rattaché à aucune entreprise. Contactez votre consultant HAVNN.",
};

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Halo discret */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-havnn-blue/10 blur-[120px]"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <HavnnLogo />
          <h1 className="mt-6 text-xl font-semibold tracking-tight">HAVNN — Client Portal</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Suivez votre visibilité locale et votre dominance sur les moteurs IA.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-2xl shadow-black/40">
          <LoginForm
            next={searchParams.next}
            demo={!isSupabaseConfigured}
            initialError={searchParams.error ? ERRORS[searchParams.error] : undefined}
          />
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Accès sécurisé · Données hébergées en Europe
        </p>
      </div>
    </main>
  );
}
