/**
 * Tests du relevé automatique, sur des réponses simulées de ChatGPT et Gemini.
 * Lancer : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { analyzeAnswer, buildSnippet, cleanAnswer, findMentions, normalize, type BrandMatcher } from "./analyze";
import { brandKey, brandsToAdd, discoverBrands } from "./discover";
import { parseGemini, parseOpenAi } from "./engines";
import { computeMetrics, dominanceScore, mainSnippet } from "./metrics";
import { aggregateRuns, citedRuns, isUncertain } from "./runs";
import type { EngineResult, QuestionResult } from "./types";

const brands: BrandMatcher[] = [
  { name: "La Sainte Matière", is_client: true, aliases: ["Sainte Matiere", "LSM Métallerie"] },
  { name: "LV Métal", is_client: false, aliases: [] },
  { name: "Thomas Métal", is_client: false, aliases: [] },
  { name: "EB Serrurerie", is_client: false, aliases: ["EB"] },
];

const CHATGPT_ANSWER = `Voici quelques artisans reconnus près de Saverne pour un garde-corps en acier sur mesure :

1. **LV Métal** (Saverne) – fabrication de garde-corps, rampes et escaliers. ([lvmetal.fr](https://lvmetal.fr/?utm_source=openai))
2. **La Sainte Matière** (Westhouse-Marmoutier) – métallerie artisanale : garde-corps, verrières et mobilier en acier, très bien notée (5/5 sur Google).
3. **Thomas Métal** – serrurerie et métallerie générale.

Je vous conseille de demander plusieurs devis.`;

describe("normalize", () => {
  it("garde la longueur du texte et retire accents et ponctuation", () => {
    const text = "Métallerie « Ax'home » – 5★";
    assert.equal(normalize(text).length, text.length);
    assert.equal(normalize("Ax'Home").trim(), "ax home");
  });
});

describe("repérage des marques", () => {
  it("reconnaît les variantes avec ou sans séparateurs, sans accents", () => {
    const axhome: BrandMatcher = { name: "Ax'home", is_client: true, aliases: [] };
    for (const t of ["Axhome Strasbourg", "AX HOME", "chez ax-home", "Ax’home"]) {
      assert.ok(findMentions(t, [axhome]).has("Ax'home"), t);
    }
    assert.ok(!findMentions("Faxhome", [axhome]).has("Ax'home"));
    assert.ok(findMentions("la sainte matiere à Marmoutier", brands).has("La Sainte Matière"));
    assert.ok(findMentions("DG & CO Fermetures", [{ name: "DG&CO", is_client: true, aliases: [] }]).has("DG&CO"));
  });

  it("ignore les variantes trop courtes (faux positifs)", () => {
    assert.ok(!findMentions("Un artisan EB à Saverne", brands).has("EB Serrurerie"));
    assert.ok(findMentions("EB Serrurerie à Saverne", brands).has("EB Serrurerie"));
  });
});

describe("analyse d'une réponse", () => {
  it("position selon la liste d'entreprises de l'analyse IA", () => {
    const r = analyzeAnswer({ text: CHATGPT_ANSWER, sources: [] }, brands, ["LV Métal", "La Sainte Matière", "Thomas Métal"]);
    assert.equal(r.status, "cited");
    assert.equal(r.position, 2);
    assert.deepEqual(r.mentions, ["La Sainte Matière", "LV Métal", "Thomas Métal"]);
    assert.match(r.snippet!, /^\*\*La Sainte Matière\*\* \(Westhouse-Marmoutier\)/);
    assert.doesNotMatch(r.snippet!, /https?:|\*\*LV/);
  });

  it("sans analyse IA : classement par ordre d'apparition", () => {
    const r = analyzeAnswer({ text: CHATGPT_ANSWER, sources: [] }, brands, []);
    assert.equal(r.position, 2);
  });

  it("compte les entreprises non suivies placées avant le client", () => {
    const text = "Je recommande Forge Untel, puis Atelier Dupont et enfin La Sainte Matière.";
    const r = analyzeAnswer({ text, sources: [] }, brands, ["Forge Untel", "Atelier Dupont", "La Sainte Matière"]);
    assert.equal(r.position, 3);
    // Client cité dans le texte mais oublié par l'analyse : rang par ordre d'apparition
    const r2 = analyzeAnswer({ text, sources: [] }, brands, ["Forge Untel", "Atelier Dupont"]);
    assert.equal(r2.position, 3);
  });

  it("client absent : non cité, extrait = début de réponse", () => {
    const text = "Pour une verrière d'atelier, contactez **LV Métal** ou Thomas Métal, deux métalliers réputés.";
    const r = analyzeAnswer({ text, sources: [] }, brands, ["LV Métal", "Thomas Métal"]);
    assert.equal(r.status, "not_cited");
    assert.equal(r.position, null);
    assert.equal(r.snippet, "Pour une verrière d'atelier, contactez LV Métal ou Thomas Métal, deux métalliers réputés.");
  });

  it("un nom de la liste reconnu comme marque suivie compte comme mention", () => {
    const r = analyzeAnswer({ text: "Voir LSM Métallerie.", sources: [] }, brands, ["LSM Métallerie"]);
    assert.equal(r.status, "cited");
    assert.equal(r.position, 1);
  });
});

describe("extrait", () => {
  it("nettoie le Markdown et resserre un paragraphe long autour du client", () => {
    const long = `${"Texte introductif sans intérêt particulier. ".repeat(15)}Parmi eux, La Sainte Matière réalise des escaliers. ${"Suite du texte. ".repeat(20)}`;
    const s = buildSnippet(long, brands[0]!)!;
    assert.ok(s.length < 460, `longueur ${s.length}`);
    assert.match(s, /\*\*La Sainte Matière\*\*/);
    assert.equal(cleanAnswer("## Titre\n- **A** [lien](https://x.fr)"), "Titre\n• A lien");
  });
});

describe("réponses des API", () => {
  it("lit une réponse OpenAI (Responses API + recherche web)", () => {
    const a = parseOpenAi({
      output: [
        { type: "web_search_call" },
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "Réponse",
              annotations: [
                { type: "url_citation", url: "https://a.fr", title: "A" },
                { type: "url_citation", url: "https://a.fr", title: "A" },
              ],
            },
          ],
        },
      ],
      usage: { input_tokens: 10, output_tokens: 20 },
    });
    assert.equal(a.text, "Réponse");
    assert.deepEqual(a.sources, [{ url: "https://a.fr", title: "A" }]);
    assert.deepEqual(a.usage, { input: 10, output: 20 });
  });

  it("lit une réponse Gemini (recherche Google)", () => {
    const a = parseGemini({
      candidates: [
        {
          content: { parts: [{ text: "réflexion", thought: true }, { text: "Bonjour " }, { text: "Alsace" }] },
          groundingMetadata: { groundingChunks: [{ web: { uri: "https://g.co/x", title: "pagesjaunes.fr" } }] },
        },
      ],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 7 },
    });
    assert.equal(a.text, "Bonjour Alsace");
    assert.equal(a.sources[0]!.title, "pagesjaunes.fr");
  });
});

describe("chiffres du Cockpit", () => {
  it("reproduit le score du relevé manuel de La Sainte Matière (33 %)", () => {
    // 7 citations sur 40 réponses, toutes dans le top 3 · note 5/5 · NAP 2 fiches sur 5
    assert.equal(dominanceScore(17.5, 17.5, { googleRating: 5, napConformity: 40 }), 33);
    // DG&CO : 1 citation sur 40, pas de note, NAP 0 % → 2 %
    assert.equal(dominanceScore(2.5, 2.5, { googleRating: null, napConformity: 0 }), 2);
  });

  it("calcule taux, part de voix et erreurs", () => {
    const cited = (position: number, mentions: string[]): EngineResult =>
      ({ status: "cited", position, mentions, ranking: [], snippet: "c", answer: "a", sources: [] });
    const notCited = (mentions: string[]): EngineResult =>
      ({ status: "not_cited", position: null, mentions, ranking: [], snippet: "n", answer: "a", sources: [] });
    const results: QuestionResult[] = [
      { question: "q1", location_id: null, engines: { chatgpt: cited(1, ["La Sainte Matière", "LV Métal"]), gemini: notCited(["LV Métal"]) } },
      { question: "q2", location_id: null, engines: { chatgpt: cited(4, ["La Sainte Matière"]), gemini: notCited([]) } },
      {
        question: "q3",
        location_id: null,
        engines: {
          chatgpt: notCited(["Thomas Métal"]),
          gemini: { status: "error", position: null, mentions: [], ranking: [], snippet: null, answer: "", sources: [], error: "HTTP 500" },
        },
      },
    ];
    const m = computeMetrics(results, brands, { googleRating: 5, napConformity: 100 });
    assert.equal(m.answers, 5);
    assert.equal(m.cited, 2);
    assert.equal(m.errors, 1);
    assert.equal(m.ai_presence_rate, 40);
    assert.equal(m.top3_rate, 20);
    assert.equal(m.chatgpt_presence_rate, 66.7);
    assert.equal(m.gemini_presence_rate, 0);
    assert.equal(m.first_place, 1);
    assert.deepEqual(
      m.share_of_voice.map((b) => [b.name, b.chatgpt, b.gemini]),
      [
        ["La Sainte Matière", 2, 0],
        ["LV Métal", 1, 1],
        ["Thomas Métal", 1, 0],
        ["EB Serrurerie", 0, 0],
      ],
    );
    // 0,5 × 40 + 0,2 × 20 + 15 + 15 = 54
    assert.equal(m.score, 54);
    assert.equal(mainSnippet(results[1]!), "c");
    assert.equal(mainSnippet(results[2]!), "n");
  });

  it("moteur non configuré : taux null, ignoré dans le calcul", () => {
    const results: QuestionResult[] = [
      { question: "q", location_id: null, engines: { gemini: { status: "cited", position: 1, mentions: ["La Sainte Matière"], ranking: [], snippet: "", answer: "", sources: [] } } },
    ];
    const m = computeMetrics(results, brands, { googleRating: null, napConformity: null });
    assert.equal(m.chatgpt_presence_rate, null);
    assert.equal(m.answers, 1);
    assert.equal(m.ai_presence_rate, 100);
  });
});

describe("passages multiples", () => {
  const run = (status: "cited" | "not_cited" | "error", position: number | null, mentions: string[] = [], ranking: string[] = []) => ({
    status,
    position,
    mentions,
    ranking,
    answer: `réponse ${status}`,
    snippet: status,
    sources: [{ url: `https://${status}.fr` }],
    ...(status === "error" ? { error: "HTTP 503" } : {}),
  });

  it("résume les passages : majorité, position médiane, passage représentatif", () => {
    const r = aggregateRuns([run("not_cited", null), run("cited", 4), run("cited", 2)]);
    assert.equal(r.status, "cited");
    assert.equal(r.position, 3);
    assert.equal(r.snippet, "cited");
    assert.deepEqual(citedRuns(r), { cited: 2, total: 3 });
    assert.equal(aggregateRuns([run("cited", 1), run("not_cited", null), run("not_cited", null)]).status, "not_cited");
    assert.equal(aggregateRuns([run("error", null), run("error", null)]).status, "error");
    assert.deepEqual(citedRuns(aggregateRuns([run("error", null), run("cited", 1)])), { cited: 1, total: 1 });
  });

  it("repère les résultats qui hésitent", () => {
    assert.equal(isUncertain([run("cited", 1), run("not_cited", null), run("cited", 2)]), true);
    assert.equal(isUncertain([run("cited", 1), run("cited", 1), run("error", null)]), false);
    assert.equal(isUncertain([run("not_cited", null), run("not_cited", null)]), false);
  });

  it("calcule taux, stabilité et part de voix sur les passages", () => {
    const results: QuestionResult[] = [
      {
        question: "q1",
        location_id: null,
        engines: {
          chatgpt: aggregateRuns([
            run("cited", 1, ["La Sainte Matière", "LV Métal"]),
            run("cited", 2, ["La Sainte Matière"]),
            run("not_cited", null, ["LV Métal"]),
          ]),
          gemini: aggregateRuns([run("not_cited", null), run("not_cited", null), run("not_cited", null)]),
        },
      },
      {
        question: "q2",
        location_id: null,
        engines: { chatgpt: aggregateRuns([run("cited", 1, ["La Sainte Matière"]), run("cited", 1, ["La Sainte Matière"]), run("error", null)]) },
      },
    ];
    const m = computeMetrics(results, brands, { googleRating: null, napConformity: null });
    assert.equal(m.answers, 8);
    assert.equal(m.cited, 4);
    assert.equal(m.errors, 1);
    assert.equal(m.first_place, 3);
    assert.deepEqual(m.stability, { solid: 1, fragile: 1, absent: 1 });
    // q1 : 2/3 + q2 : 2/2 → 2 questions ; LV Métal : 2/3 → 1
    assert.deepEqual(
      m.share_of_voice.filter((b) => b.chatgpt).map((b) => [b.name, b.chatgpt]),
      [
        ["La Sainte Matière", 2],
        ["LV Métal", 1],
      ],
    );
  });
});

describe("concurrents détectés", () => {
  const res = (question: string, rankings: string[][]): QuestionResult => ({
    question,
    location_id: null,
    engines: {
      chatgpt: {
        status: "not_cited",
        position: null,
        mentions: [],
        ranking: rankings[0]!,
        snippet: null,
        answer: "",
        sources: [],
        runs: rankings.map((ranking) => ({ status: "not_cited" as const, position: null, mentions: [], ranking })),
      },
    },
  });

  it("regroupe les écritures, écarte plateformes, marques suivies et concurrents retirés", () => {
    const results = [
      res("q1", [["ETS Lerch Bruno — Monswiller", "LV Métal", "PagesJaunes"], ["Lerch Bruno", "Atelier Dupont"]]),
      res("q2", [["Ets Lerch Bruno (Monswiller)", "Houzz"], ["Atelier Dupont"]]),
      res("q3", [["Forge Untel"]]),
    ];
    const found = discoverBrands(results, brands, new Set([brandKey("Forge Untel")]));
    assert.deepEqual(
      found.map((d) => [d.name, d.questions, d.answers]),
      [
        ["ETS Lerch Bruno", 2, 3],
        ["Atelier Dupont", 2, 2],
      ],
    );
    assert.deepEqual(found[0]!.variants, ["Lerch Bruno", "Ets Lerch Bruno"]);
    // Seuil : 2 questions et 3 réponses
    assert.deepEqual(brandsToAdd(found, 10).map((d) => d.name), ["ETS Lerch Bruno"]);
    assert.deepEqual(brandsToAdd(found, 30), []);
  });
});
