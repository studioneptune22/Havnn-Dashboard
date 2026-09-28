export const PERIODS = [
  { value: "3m", label: "3 derniers mois", months: 3 },
  { value: "6m", label: "6 derniers mois", months: 6 },
  { value: "12m", label: "12 derniers mois", months: 12 },
] as const;

export type Period = (typeof PERIODS)[number]["value"];

export const DEFAULT_PERIOD: Period = "6m";

export function parsePeriod(value: string | string[] | undefined): Period {
  const v = Array.isArray(value) ? value[0] : value;
  return PERIODS.some((p) => p.value === v) ? (v as Period) : DEFAULT_PERIOD;
}

export function periodMonths(period: Period) {
  return PERIODS.find((p) => p.value === period)!.months;
}

/** Date ISO de début de période, relative à `now`. */
export function periodStart(period: Period, now = new Date()) {
  const d = new Date(now);
  d.setMonth(d.getMonth() - periodMonths(period));
  return d.toISOString();
}
