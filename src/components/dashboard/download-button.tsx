import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DownloadButton({ href, disabled, label = "Télécharger" }: { href: string; disabled?: boolean; label?: string }) {
  if (disabled || href === "#") {
    return (
      <Button variant="outline" size="sm" disabled title="Téléchargement indisponible en mode démo">
        <Download />
        {label}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={href} target="_blank" rel="noreferrer" download>
        <Download />
        {label}
      </a>
    </Button>
  );
}
