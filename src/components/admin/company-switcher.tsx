"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Building2, Loader2 } from "lucide-react";

import { switchCompany } from "@/app/dashboard/admin/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Company } from "@/types/database";

/** Sélecteur du client consulté (admins HAVNN) : tout le portail bascule sur ce client. */
export function CompanySwitcher({
  companies,
  value,
  onSwitched,
}: {
  companies: Pick<Company, "id" | "name">[];
  value: string;
  onSwitched?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function onChange(id: string) {
    const fd = new FormData();
    fd.set("company_id", id);
    startTransition(async () => {
      const { error } = await switchCompany(fd);
      if (error) return window.alert(error);
      // Les filtres d'URL (centre…) appartiennent au client précédent.
      router.replace(pathname, { scroll: false });
      router.refresh();
      onSwitched?.();
    });
  }

  return (
    <div className="space-y-1.5">
      <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-havnn-blue">Vue HAVNN · client</p>
      <Select value={value} onValueChange={onChange} disabled={pending}>
        <SelectTrigger aria-label="Client affiché">
          {pending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
