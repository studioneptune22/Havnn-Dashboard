"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { Plus } from "lucide-react";

import { createCompany, type ActionState } from "@/app/dashboard/admin/actions";
import { Input } from "@/components/ui/input";

import { Field, FormMessage, selectClass, SubmitButton } from "./form-bits";

export function NewCompanyForm() {
  const [state, action] = useFormState<ActionState, FormData>(createCompany, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom de l'entreprise *" htmlFor="nc-name">
          <Input id="nc-name" name="name" required maxLength={120} placeholder="Menuiserie Exemple" />
        </Field>
        <Field label="Site web" htmlFor="nc-domain" hint="Sert à identifier le client (webhook, relevés).">
          <Input id="nc-domain" name="domain" maxLength={200} placeholder="menuiserie-exemple.fr" />
        </Field>
        <Field label="Ville" htmlFor="nc-city" hint="Localise la recherche web de ChatGPT.">
          <Input id="nc-city" name="city" maxLength={120} placeholder="Strasbourg" />
        </Field>
        <Field label="Activité" htmlFor="nc-sector">
          <Input id="nc-sector" name="sector" maxLength={160} placeholder="Menuiseries & fermetures" />
        </Field>
        <Field label="Statut de la mission" htmlFor="nc-status">
          <select id="nc-status" name="plan_status" defaultValue="onboarding" className={selectClass}>
            <option value="onboarding">Onboarding en cours</option>
            <option value="active">Optimisation GEO active</option>
            <option value="paused">Mission en pause</option>
          </select>
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>
          <Plus /> Créer le client
        </SubmitButton>
        <FormMessage state={state} />
      </div>
      <p className="text-xs text-muted-foreground">
        Créez ensuite son accès au portail dans le bloc « Accès au portail » (mot de passe provisoire à envoyer par SMS).
      </p>
    </form>
  );
}
