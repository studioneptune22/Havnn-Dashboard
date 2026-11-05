"use client";

import { useFormState } from "react-dom";
import { Save } from "lucide-react";

import { saveBrands, type ActionState } from "@/app/dashboard/admin/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Field, FormMessage, SubmitButton } from "./form-bits";

export function BrandsForm({
  companyId,
  clientName,
  clientAliases,
  competitors,
}: {
  companyId: string;
  clientName: string;
  clientAliases: string;
  competitors: string;
}) {
  const [state, action] = useFormState<ActionState, FormData>(saveBrands, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="company_id" value={companyId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom du client *" htmlFor="b-client" hint="Tel qu'affiché dans la part de voix.">
          <Input id="b-client" name="client_name" required maxLength={120} defaultValue={clientName} />
        </Field>
        <Field label="Variantes du nom du client" htmlFor="b-aliases" hint="Séparées par des virgules.">
          <Input id="b-aliases" name="client_aliases" maxLength={2000} defaultValue={clientAliases} placeholder="Sigle, ancien nom, nom commercial…" />
        </Field>
      </div>
      <Field
        label="Concurrents suivis"
        htmlFor="b-competitors"
        hint="Un concurrent par ligne : Nom | variante 1, variante 2. Majuscules, accents, tirets et apostrophes sont ignorés (« Ax'home » reconnaît déjà « Axhome » et « AX HOME ») ; les variantes de moins de 3 lettres sont ignorées."
      >
        <Textarea
          id="b-competitors"
          name="competitors"
          rows={Math.min(18, Math.max(6, competitors.split("\n").length + 2))}
          defaultValue={competitors}
          className="font-mono text-xs leading-relaxed sm:text-sm"
          placeholder={"Menuiserie Dupont | Dupont Fenêtres\nAlsace Rénovation | Alsace Renov"}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>
          <Save /> Enregistrer les marques
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
