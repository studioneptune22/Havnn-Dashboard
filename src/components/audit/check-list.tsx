import type { TechnicalCheck } from "@/types/database";

import { CheckStatusBadge, CheckStatusIcon } from "./check-status";

export function CheckList({ checks }: { checks: TechnicalCheck[] }) {
  if (checks.length === 0) {
    return <p className="text-sm text-muted-foreground">Audit en cours de réalisation.</p>;
  }
  return (
    <ul className="divide-y rounded-lg border">
      {checks.map((c) => (
        <li key={c.id} className="flex items-start gap-3 p-3">
          <CheckStatusIcon status={c.status} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={c.pillar === "schema" ? "font-mono text-sm" : "text-sm font-medium"}>{c.label}</p>
              <CheckStatusBadge status={c.status} />
            </div>
            {c.details && <p className="mt-1 text-xs text-muted-foreground">{c.details}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
