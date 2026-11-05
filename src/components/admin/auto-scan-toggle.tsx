"use client";

import { useFormState } from "react-dom";
import { Power } from "lucide-react";

import { setAutoScan, type ActionState } from "@/app/dashboard/admin/actions";

import { FormMessage, SubmitButton } from "./form-bits";

export function AutoScanToggle({ companyId, enabled }: { companyId: string; enabled: boolean }) {
  const [state, action] = useFormState<ActionState, FormData>(setAutoScan, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="enabled" value={String(!enabled)} />
      <SubmitButton variant={enabled ? "outline" : "default"}>
        <Power /> {enabled ? "Retirer du relevé automatique" : "Inclure dans le relevé automatique"}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
