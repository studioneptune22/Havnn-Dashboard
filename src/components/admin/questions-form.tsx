"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Save } from "lucide-react";

import { saveQuestions, type ActionState } from "@/app/dashboard/admin/actions";
import { Textarea } from "@/components/ui/textarea";

import { FormMessage, SubmitButton } from "./form-bits";

const lines = (text: string) =>
  new Set(
    text
      .split("\n")
      .map((l) => l.replace(/^\[[^\]]+\]\s*/, "").replace(/\s+/g, " ").trim())
      .filter(Boolean),
  );

export function QuestionsForm({ companyId, initial, multiSite }: { companyId: string; initial: string; multiSite: boolean }) {
  const [state, action] = useFormState<ActionState, FormData>(saveQuestions, {});
  const [value, setValue] = useState(initial);
  const count = lines(value).size;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const before = lines(initial);
        const after = lines(value);
        const removed = Array.from(before).filter((q) => !after.has(q)).length;
        if (
          removed > 0 &&
          !window.confirm(`${removed} question${removed > 1 ? "s" : ""} retirée${removed > 1 ? "s" : ""} : son historique de résultats sera supprimé. Continuer ?`)
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="company_id" value={companyId} />
      <Textarea
        name="questions"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={Math.min(24, Math.max(8, value.split("\n").length + 1))}
        className="font-mono text-xs leading-relaxed sm:text-sm"
        placeholder={"Quel menuisier pour remplacer mes fenêtres près de Strasbourg ?\nQui pose des portes de garage dans le Kochersberg ?"}
        aria-label="Questions suivies"
      />
      <p className="text-xs text-muted-foreground">
        Une question par ligne ({count} actuellement, 20 recommandées). Une question modifiée compte comme une nouvelle
        question : elle repart « en attente » jusqu&apos;au prochain relevé.
        {multiSite && <> Pour rattacher une question à un centre : <code>[Nom du centre] Question</code>.</>}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>
          <Save /> Enregistrer les questions
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
