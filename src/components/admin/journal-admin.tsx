"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { Plus, Trash2 } from "lucide-react";

import { addActivity, deleteActivity, type ActionState } from "@/app/dashboard/admin/actions";
import { ACTIVITY_CATEGORY } from "@/components/dashboard/activity-feed";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { todayInParis } from "@/lib/admin/parse";
import { formatDateLong } from "@/lib/utils";
import type { ActivityCategory, ActivityLog } from "@/types/database";

import { Field, FormMessage, selectClass, SubmitButton } from "./form-bits";

const CATEGORIES = Object.entries(ACTIVITY_CATEGORY) as [ActivityCategory, { label: string }][];

export function JournalForm({ companyId }: { companyId: string }) {
  const [state, action] = useFormState<ActionState, FormData>(addActivity, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  const today = todayInParis();

  return (
    <form ref={form} action={action} className="space-y-4">
      <input type="hidden" name="company_id" value={companyId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_200px_170px]">
        <Field label="Titre *" htmlFor="j-title">
          <Input id="j-title" name="title" required maxLength={200} placeholder="Fiche Google Business Profile optimisée" />
        </Field>
        <Field label="Catégorie" htmlFor="j-category">
          <select id="j-category" name="category" defaultValue="nap" className={selectClass}>
            {CATEGORIES.map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" htmlFor="j-date">
          <Input id="j-date" name="date" type="date" defaultValue={today} max={today} />
        </Field>
      </div>
      <Field label="Description" htmlFor="j-description" hint="Visible par le client, en entier, dans son journal d'activité.">
        <Textarea id="j-description" name="description" rows={4} maxLength={4000} placeholder="Ce qui a été fait, pourquoi, et le résultat attendu." />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>
          <Plus /> Ajouter au journal
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function DeleteButton({ companyId, item }: { companyId: string; item: ActivityLog }) {
  const [state, action] = useFormState<ActionState, FormData>(deleteActivity, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer « ${item.title} » du journal ?`)) e.preventDefault();
      }}
      className="flex shrink-0 flex-col items-end gap-1"
    >
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="id" value={item.id} />
      <button
        type="submit"
        title="Supprimer"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-400"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Supprimer</span>
      </button>
      {state.error && <span className="text-xs text-rose-400">{state.error}</span>}
    </form>
  );
}

export function JournalAdminList({ companyId, items }: { companyId: string; items: ActivityLog[] }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Journal vide.</p>;
  return (
    <ul className="divide-y">
      {items.map((item) => {
        const { icon: Icon, label } = ACTIVITY_CATEGORY[item.category] ?? ACTIVITY_CATEGORY.other;
        return (
          <li key={item.id} className="flex items-start gap-3 py-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-havnn-blue" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateLong(item.created_at)} · {label}
              </p>
              {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
            </div>
            <DeleteButton companyId={companyId} item={item} />
          </li>
        );
      })}
    </ul>
  );
}
