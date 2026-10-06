import { FileText, Gauge, History, MessageSquareText, ShieldCheck, type LucideIcon } from "lucide-react";

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
