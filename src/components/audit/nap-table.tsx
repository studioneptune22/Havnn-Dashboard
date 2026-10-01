import { Check, X } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NapCitation } from "@/types/database";

function Cell({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <Check className="mx-auto h-4 w-4 text-emerald-400" aria-label={`${label} conforme`} />
  ) : (
    <X className="mx-auto h-4 w-4 text-rose-400" aria-label={`${label} incohérent`} />
  );
}

export function NapTable({
  citations,
  locationNames,
}: {
  citations: NapCitation[];
  /** Multi-sites, vue « tous les centres » : ajoute une colonne Centre. */
  locationNames?: Map<string, string>;
}) {
  if (citations.length === 0) {
    return <p className="text-sm text-muted-foreground">Cartographie des citations en cours.</p>;
  }
  const showLocation = Boolean(locationNames?.size);
  const centre = (c: NapCitation) => (c.location_id && locationNames?.get(c.location_id)) || "Groupe";
  const rows = showLocation
    ? [...citations].sort((a, b) => centre(a).localeCompare(centre(b), "fr") || a.platform.localeCompare(b.platform, "fr"))
    : citations;
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {showLocation && <TableHead>Centre</TableHead>}
            <TableHead>Plateforme</TableHead>
            <TableHead className="text-center">Nom</TableHead>
            <TableHead className="text-center">Adresse</TableHead>
            <TableHead className="text-center">Tél.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => {
            const aligned = c.name_ok && c.address_ok && c.phone_ok;
            return (
              <TableRow key={c.id} className={aligned ? undefined : "bg-rose-500/[0.04]"}>
                {showLocation && <TableCell className="py-2 text-sm text-muted-foreground">{centre(c)}</TableCell>}
                <TableCell className="py-2 text-sm">
                  {c.listing_url ? (
                    <a href={c.listing_url} target="_blank" rel="noreferrer" className="hover:underline">
                      {c.platform}
                    </a>
                  ) : (
                    c.platform
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <Cell ok={c.name_ok} label="Nom" />
                </TableCell>
                <TableCell className="py-2">
                  <Cell ok={c.address_ok} label="Adresse" />
                </TableCell>
                <TableCell className="py-2">
                  <Cell ok={c.phone_ok} label="Téléphone" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
