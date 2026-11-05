"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const REPORT_URL = "/dashboard/rapports/generer";

/** Génère le rapport PDF à la volée et le télécharge. */
export function GenerateReportButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function generate() {
    setPending(true);
    setError(false);
    try {
      const res = await fetch(REPORT_URL, { cache: "no-store" });
      if (!res.ok || res.headers.get("Content-Type") !== "application/pdf") throw new Error(String(res.status));

      const filename = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "rapport-geo.pdf";
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={generate} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <FileDown />}
        {pending ? "Génération…" : "Générer un rapport"}
      </Button>
      {error && <p className="text-xs text-rose-400">La génération a échoué. Réessayez dans un instant.</p>}
    </div>
  );
}
