import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  title,
  icon: Icon,
  children,
  footer,
  className,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="grid h-8 w-8 place-items-center rounded-lg border bg-background/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-3 flex-1">{children}</div>
      {footer && <div className="mt-4 border-t pt-3">{footer}</div>}
    </Card>
  );
}
