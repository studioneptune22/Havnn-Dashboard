import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { napSummary } from "@/lib/locations";
import type { Location, NapCitation } from "@/types/database";

/** Vue d'ensemble des établissements d'un client multi-sites. */
export function LocationsCard({ locations, nap }: { locations: Location[]; nap: NapCitation[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vos centres</CardTitle>
        <CardDescription>Note Google et cohérence des fiches (Nom / Adresse / Tél.) de chaque établissement.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[220px]">Centre</TableHead>
                <TableHead className="min-w-[120px]">Note Google</TableHead>
                <TableHead className="text-right">Avis</TableHead>
                <TableHead className="min-w-[140px] text-right">Fiches NAP conformes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((l) => {
                const { checked, aligned } = napSummary(nap, l.id);
                return (
                  <TableRow key={l.id}>
                    <TableCell className="py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {l.google_maps_url ? (
                          <a href={l.google_maps_url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                            {l.name}
                          </a>
                        ) : (
                          <span className="font-medium">{l.name}</span>
                        )}
                        {l.brand && <Badge variant="outline">{l.brand}</Badge>}
                      </div>
                      {(l.address || l.city) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[l.address, [l.postal_code, l.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      {l.google_rating === null ? (
                        <span className="text-xs text-muted-foreground">À relever</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 tabular">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                          {Number(l.google_rating).toLocaleString("fr-FR", { minimumFractionDigits: 1 })}
                          <span className="text-xs text-muted-foreground">/ 5</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-right tabular">{l.google_reviews_total ?? "—"}</TableCell>
                    <TableCell className="py-2.5 text-right tabular">
                      {checked === 0 ? (
                        <span className="text-xs text-muted-foreground">À auditer</span>
                      ) : (
                        <span className={aligned === checked ? "text-emerald-400" : "text-amber-400"}>
                          {aligned} / {checked}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
