"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2, MapPin } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_LOCATIONS } from "@/lib/locations";
import type { Location } from "@/types/database";

/** Sélecteur d'établissement, synchronisé avec le paramètre d'URL `centre`. */
export function LocationSelect({ locations, value }: { locations: Location[]; value: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === ALL_LOCATIONS) params.delete("centre");
    else params.set("centre", next);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  return (
    <Select value={value ?? ALL_LOCATIONS} onValueChange={onChange}>
      <SelectTrigger className="w-[240px]" aria-label="Centre">
        {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_LOCATIONS}>Tous les centres ({locations.length})</SelectItem>
        {locations.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
