"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { HavnnLogo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav({ footer }: { footer: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col p-4">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <HavnnLogo withTagline className="mb-6 px-2" />
        <SidebarNav onNavigate={() => setOpen(false)} />
        <div className="mt-auto">{footer}</div>
      </SheetContent>
    </Sheet>
  );
}
