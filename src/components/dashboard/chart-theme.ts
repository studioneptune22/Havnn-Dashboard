/**
 * Couleurs de séries des graphiques (palette catégorielle validée pour le fond
 * #14161A : contraste ≥ 3:1, séparation daltonisme ΔE ≥ 9 sur les 3 slots).
 * L'ordre est fixe : une série garde toujours la même couleur.
 */
export const ENGINE_COLORS = {
  chatgpt: "#3987e5",
  perplexity: "#d95926",
  gemini: "#199e70",
} as const;

export const ENGINE_LABELS = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
} as const;

export const CHART = {
  grid: "#22262F",
  axis: "#8b919e",
  text: "#e8eaee",
  surface: "#14161A",
} as const;
