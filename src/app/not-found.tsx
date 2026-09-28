import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="space-y-3">
        <p className="font-mono text-sm text-havnn-blue">404</p>
        <h1 className="text-2xl font-semibold">Page introuvable</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Retour au cockpit</Link>
        </Button>
      </div>
    </main>
  );
}
