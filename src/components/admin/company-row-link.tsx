"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { switchCompany } from "@/app/dashboard/admin/actions";
import { cn } from "@/lib/utils";

/** Nom d'un client dans le tableau admin : un clic en fait le client actif. */
export function CompanyRowLink({ id, active, children }: { id: string; active: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={active || pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("company_id", id);
        startTransition(async () => {
          const { error } = await switchCompany(fd);
          if (error) return window.alert(error);
          router.refresh();
        });
      }}
      className={cn("inline-flex items-center gap-1.5 text-left font-medium", active ? "text-havnn-blue" : "hover:underline")}
    >
      {children}
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {active && <span className="text-xs font-normal text-muted-foreground">(actif)</span>}
    </button>
  );
}
