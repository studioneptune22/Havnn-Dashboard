import { LogOut } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import type { Session } from "@/lib/data/queries";

export function UserCard({ session }: { session: Session }) {
  const name = session.user.full_name ?? session.user.email;
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/40 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="truncate text-xs text-muted-foreground">{session.company.name}</div>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          title="Se déconnecter"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Se déconnecter</span>
        </button>
      </form>
    </div>
  );
}
