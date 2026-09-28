import { cn } from "@/lib/utils";

export function HavnnLogo({ className, withTagline = false }: { className?: string; withTagline?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid h-8 w-8 place-items-center rounded-lg border border-havnn-line bg-gradient-to-br from-havnn-blue/25 to-havnn-emerald/10">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path d="M5 4v16M19 4v16M5 12h14" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-[0.2em]">HAVNN</div>
        {withTagline && <div className="text-[11px] text-muted-foreground">Client Portal</div>}
      </div>
    </div>
  );
}
