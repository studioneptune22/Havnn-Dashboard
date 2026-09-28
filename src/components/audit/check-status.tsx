import { AlertTriangle, CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CheckStatus } from "@/types/database";

export const CHECK_STATUS: Record<
  CheckStatus,
  { label: string; icon: LucideIcon; text: string; variant: "success" | "warning" | "danger" | "outline" }
> = {
  ok: { label: "Conforme", icon: CheckCircle2, text: "text-emerald-400", variant: "success" },
  warning: { label: "À compléter", icon: AlertTriangle, text: "text-amber-400", variant: "warning" },
  error: { label: "Non conforme", icon: XCircle, text: "text-rose-400", variant: "danger" },
  pending: { label: "Planifié", icon: Clock, text: "text-muted-foreground", variant: "outline" },
};

export function CheckStatusIcon({ status, className }: { status: CheckStatus; className?: string }) {
  const { icon: Icon, text, label } = CHECK_STATUS[status];
  return <Icon className={cn("h-4 w-4 shrink-0", text, className)} aria-label={label} />;
}

export function CheckStatusBadge({ status }: { status: CheckStatus }) {
  const { label, variant } = CHECK_STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}
