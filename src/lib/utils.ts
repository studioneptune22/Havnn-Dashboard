import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });
const dateLongFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "12 sept." */
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
/** "12 septembre 2026" */
export const formatDateLong = (iso: string) => dateLongFmt.format(new Date(iso));
/** "12 sept., 09:30" */
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Variation en points entre deux valeurs, arrondie à 1 décimale. */
export function delta(current: number, previous: number | undefined) {
  if (previous === undefined) return 0;
  return Math.round((current - previous) * 10) / 10;
}
