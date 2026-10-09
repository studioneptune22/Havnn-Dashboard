/**
 * Lecture des réponses IA : repérage des marques suivies, position du client, extrait.
 * Fonctions pures (aucun appel réseau), testées dans analyze.test.ts.
 */

import type { EngineAnswer, EngineResult } from "./types";

export interface BrandMatcher {
  name: string;
  is_client: boolean;
  aliases: string[];
}

/**
 * Normalisation caractère par caractère (même longueur que le texte d'origine) :
 * minuscules, sans accents, tout ce qui n'est ni lettre ni chiffre devient une espace.
 */
export function normalize(text: string) {
  let out = "";
  for (const ch of text) {
    const base = ch.normalize("NFD")[0]!.toLowerCase();
    const c = base === "œ" ? "o" : base === "æ" ? "a" : base;
    // Les caractères hors BMP (emojis) occupent 2 unités : on garde la même longueur.
    out += (/^[a-z0-9]$/.test(c) ? c : " ").padEnd(ch.length, " ");
  }
  return out;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Variantes trop courtes ignorées : « EB » ou « K » provoqueraient des faux positifs. */
const MIN_ALIAS_LENGTH = 3;

/**
 * Expression régulière d'une marque (sur le texte normalisé) : chaque variante, avec ou sans
 * séparateurs entre les mots (« Ax'home » reconnaît « Ax home », « Ax-home » et « Axhome »).
 */
export function brandPattern(brand: BrandMatcher): RegExp | null {
  const variants = [brand.name, ...brand.aliases]
    .map((v) => normalize(v).split(" ").filter(Boolean))
    .filter((tokens) => tokens.join("").length >= MIN_ALIAS_LENGTH)
    .map((tokens) => tokens.map(escapeRe).join("[^a-z0-9]*"));
  if (variants.length === 0) return null;
  const unique = Array.from(new Set(variants)).sort((a, b) => b.length - a.length);
  return new RegExp(`(?<![a-z0-9])(?:${unique.join("|")})(?![a-z0-9])`, "g");
}

/** Positions (début, fin) de toutes les mentions d'une marque dans un texte. */
export function findMatches(text: string, brand: BrandMatcher): [number, number][] {
  const re = brandPattern(brand);
  if (!re) return [];
  const norm = normalize(text);
  return Array.from(norm.matchAll(re), (m) => [m.index!, m.index! + m[0].length] as [number, number]);
}

/** Marques présentes dans le texte, avec l'index de leur première mention. */
export function findMentions(text: string, brands: BrandMatcher[]) {
  const found = new Map<string, number>();
  for (const b of brands) {
    const first = findMatches(text, b)[0];
    if (first) found.set(b.name, first[0]);
  }
  return found;
}

/**
 * Nettoie le Markdown des réponses (liens, gras, titres, références de sources)
 * pour un extrait lisible : le gras `**…**` est réservé au surlignage du client.
 */
export function cleanAnswer(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/【[^】]*】/g, "")
    .replace(/\(\s*\[[^\]]*\]\([^)]*\)\s*\)/g, "") // ([site.fr](https://…)) : citation de source
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "• ")
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, "") // séparateurs de tableaux Markdown
    .replace(/\|/g, " · ")
    .replace(/[ \t]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SNIPPET_MAX = 420;

function truncate(text: string, max = SNIPPET_MAX) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`;
}

/** Entoure de `**…**` chaque mention du client (texte déjà nettoyé). */
export function highlight(text: string, client: BrandMatcher) {
  const matches = findMatches(text, client);
  let out = "";
  let last = 0;
  for (const [start, end] of matches) {
    out += `${text.slice(last, start)}**${text.slice(start, end)}**`;
    last = end;
  }
  return out + text.slice(last);
}

/**
 * Extrait affiché dans le portail : le paragraphe où le client apparaît pour la première fois
 * (resserré autour de la mention s'il est long), sinon le début de la réponse.
 */
export function buildSnippet(answer: string, client: BrandMatcher) {
  const text = cleanAnswer(answer);
  if (!text) return null;
  const first = findMatches(text, client)[0];
  if (!first) return truncate(text.replace(/\n+/g, " "));

  const paraStart = text.lastIndexOf("\n", first[0]) + 1;
  const nextBreak = text.indexOf("\n", first[1]);
  let para = text.slice(paraStart, nextBreak === -1 ? undefined : nextBreak).trim();
  // Une ligne de liste seule est courte : on y joint la suivante (souvent la description).
  if (para.length < 80 && nextBreak !== -1) {
    const after = text.indexOf("\n", nextBreak + 1);
    para = text.slice(paraStart, after === -1 ? undefined : after).replace(/\n+/g, " ").trim();
  }
  if (para.length > SNIPPET_MAX) {
    const local = findMatches(para, client)[0]?.[0] ?? 0;
    const sentenceStart = Math.max(para.lastIndexOf(". ", local) + 2, 0);
    const start = local - sentenceStart > SNIPPET_MAX / 2 ? Math.max(local - 80, 0) : sentenceStart;
    para = `${start > 0 ? "…" : ""}${truncate(para.slice(start).trim())}`;
  }
  // « 2. La Sainte Matière… » : le numéro de liste n'a pas de sens hors de la réponse.
  return highlight(para.replace(/^(?:\d+[.)]|•)\s+/, ""), client);
}

/** Nom d'entreprise (liste de l'analyse) → marque suivie correspondante. */
export function matchBrand(name: string, brands: BrandMatcher[]) {
  return brands.find((b) => findMatches(name, b).length > 0) ?? null;
}

/**
 * Analyse d'une réponse : marques présentes (repérage par variantes + liste de l'analyse IA),
 * position du client parmi les entreprises recommandées, extrait.
 *
 * `ranking` = entreprises recommandées dans l'ordre (analyse IA) ; vide si l'analyse a échoué,
 * auquel cas l'ordre d'apparition des marques suivies dans le texte sert de classement.
 */
export function analyzeAnswer(answer: EngineAnswer, brands: BrandMatcher[], ranking: string[]): EngineResult {
  const client = brands.find((b) => b.is_client);
  if (!client) throw new Error("Aucune marque client définie.");

  const text = answer.text;
  const mentions = findMentions(text, brands);
  for (const name of ranking) {
    const brand = matchBrand(name, brands);
    if (brand && !mentions.has(brand.name)) mentions.set(brand.name, Number.MAX_SAFE_INTEGER);
  }

  let position: number | null = null;
  if (mentions.has(client.name)) {
    const inRanking = ranking.findIndex((name) => matchBrand(name, [client]));
    if (inRanking !== -1) {
      position = inRanking + 1;
    } else {
      // Client cité mais absent de la liste : rang selon l'ordre d'apparition dans le texte,
      // en comptant les entreprises de la liste et les marques suivies placées avant lui.
      const clientAt = mentions.get(client.name)!;
      const norm = normalize(text);
      const before = new Set<string>();
      for (const [name, at] of Array.from(mentions)) if (name !== client.name && at < clientAt) before.add(name);
      for (const name of ranking) {
        const at = norm.indexOf(normalize(name).trim());
        const brand = matchBrand(name, brands);
        if (at !== -1 && at < clientAt && !brand) before.add(name);
      }
      position = before.size + 1;
    }
  }

  return {
    status: mentions.has(client.name) ? "cited" : "not_cited",
    position,
    mentions: brands.filter((b) => mentions.has(b.name)).map((b) => b.name),
    ranking,
    snippet: buildSnippet(text, client),
    answer: text,
    sources: answer.sources,
  };
}
