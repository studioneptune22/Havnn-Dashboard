"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

import type { ActionState } from "@/app/dashboard/admin/actions";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Bouton d'envoi avec indicateur de chargement. */
export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

/** Message de retour d'une action (succès ou erreur). */
export function FormMessage({ state }: { state: ActionState }) {
  if (!state.ok && !state.error) return null;
  return (
    <p
      role="status"
      className={cn("flex items-start gap-2 text-sm", state.error ? "text-rose-400" : "text-emerald-400")}
    >
      {state.error ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      {state.error ?? state.ok}
    </p>
  );
}

export const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
