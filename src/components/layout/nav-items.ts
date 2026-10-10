import { FileText, Gauge, History, MessageSquareText, Settings2, ShieldCheck, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Cockpit", description: "Vue d'ensemble & ROI", icon: Gauge },
  { href: "/dashboard/geo-prompts", label: "Benchmark IA & Prompts", description: "Suivi des prompts métiers", icon: MessageSquareText },
  { href: "/dashboard/audit-technique", label: "Structure & Factualité", description: "Les 4 piliers GEO", icon: ShieldCheck },
  { href: "/dashboard/journal", label: "Journal d'activité", description: "Toutes les actions HAVNN", icon: History },
  { href: "/dashboard/rapports", label: "Documents & Rapports", description: "Rapports & coffre-fort", icon: FileText },
];

/** Entrée réservée aux consultants HAVNN. */
export const ADMIN_NAV_ITEM: NavItem = {
  href: "/dashboard/admin",
  label: "Administration",
  description: "Clients, journal, relevés",
  icon: Settings2,
};
