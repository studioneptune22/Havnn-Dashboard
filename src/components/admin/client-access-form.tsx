"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Check, Copy, UserPlus } from "lucide-react";

import { createClientAccess, type ActionState } from "@/app/dashboard/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Field, FormMessage, SubmitButton } from "./form-bits";

export function ClientAccessForm({ companyId }: { companyId: string }) {
  const [state, action] = useFormState<ActionState, FormData>(createClientAccess, {});
  const [copied, setCopied] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="company_id" value={companyId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email du client *" htmlFor="ca-email">
          <Input id="ca-email" name="email" type="email" required maxLength={200} placeholder="contact@menuiserie-exemple.fr" />
        </Field>
        <Field label="Prénom et nom" htmlFor="ca-name">
          <Input id="ca-name" name="full_name" maxLength={120} placeholder="Prénom Nom" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant="secondary">
          <UserPlus /> Créer l&apos;accès
        </SubmitButton>
        <FormMessage state={state} />
      </div>
      {state.password && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-havnn-blue/30 bg-havnn-blue/10 p-3">
          <span className="text-sm">Mot de passe provisoire :</span>
          <code className="rounded bg-background px-2 py-1 font-mono text-sm">{state.password}</code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(state.password!);
              setCopied(true);
            }}
          >
            {copied ? <Check /> : <Copy />} {copied ? "Copié" : "Copier"}
          </Button>
          <span className="w-full text-xs text-muted-foreground">Affiché une seule fois : notez-le avant de quitter la page.</span>
        </div>
      )}
    </form>
  );
}
