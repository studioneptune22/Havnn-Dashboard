"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";

import { signIn, type LoginState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
      {pending ? "Connexion…" : "Accéder à mon espace"}
    </Button>
  );
}

export function LoginForm({ next, demo, initialError }: { next?: string; demo: boolean; initialError?: string }) {
  const [state, action] = useFormState<LoginState, FormData>(signIn, { error: initialError });

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email professionnel</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@entreprise.fr"
            className="pl-9"
            required={!demo}
            defaultValue={demo ? "julien@atelier-vogel-paysage.fr" : undefined}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <a href="mailto:support@havnn.fr" className="text-xs text-muted-foreground hover:text-foreground">
            Mot de passe oublié ?
          </a>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-9"
            required={!demo}
            defaultValue={demo ? "demo-password" : undefined}
          />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {state.error}
        </p>
      )}

      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <SubmitButton />

      {demo && (
        <p className="rounded-md border border-havnn-blue/25 bg-havnn-blue/10 px-3 py-2 text-xs text-blue-200">
          Mode démo : Supabase n&apos;est pas configuré. Cliquez simplement sur « Accéder à mon espace ».
        </p>
      )}
    </form>
  );
}
