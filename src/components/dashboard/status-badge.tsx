import { Badge } from "@/components/ui/badge";
import type { Company } from "@/types/database";

const STATUS: Record<Company["plan_status"], { label: string; variant: "success" | "warning" | "outline" }> = {
  active: { label: "Optimisation GEO Active", variant: "success" },
  onboarding: { label: "Onboarding en cours", variant: "warning" },
  paused: { label: "Mission en pause", variant: "outline" },
};

export function AccountStatusBadge({ status }: { status: Company["plan_status"] }) {
  const s = STATUS[status];
  return (
    <Badge variant={s.variant} className="px-2.5 py-1">
      <span className="relative flex h-2 w-2">
        {status === "active" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {s.label}
    </Badge>
  );
}
