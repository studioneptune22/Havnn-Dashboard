import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatCompetitors,
  formatQuestions,
  journalTimestamp,
  normalizeDomain,
  parseAliases,
  parseCompetitors,
  parseQuestions,
} from "./parse";

const locations = [{ id: "loc-1", name: "Autovision Illkirch" }];

describe("saisie de la vue admin", () => {
  it("normalise un domaine", () => {
    assert.equal(normalizeDomain(" https://www.DGCO-Fermetures.com/contact?x=1 "), "dgco-fermetures.com");
    assert.equal(normalizeDomain("  "), null);
  });

  it("lit les questions, centres et doublons", () => {
    const { questions, errors } = parseQuestions(
      "Quel menuisier à Schnersheim ?\n\n  quel menuisier à schnersheim ?\n[autovision illkirch]  Contrôle technique à Illkirch ?\n[Centre X] Question",
      locations,
    );
    assert.deepEqual(questions, [
      { text: "Quel menuisier à Schnersheim ?", locationId: null },
      { text: "Contrôle technique à Illkirch ?", locationId: "loc-1" },
    ]);
    assert.deepEqual(errors, ["Centre inconnu : « Centre X »."]);
    assert.equal(
      formatQuestions([{ prompt_text: "Contrôle technique à Illkirch ?", location_id: "loc-1" }], locations),
      "[Autovision Illkirch] Contrôle technique à Illkirch ?",
    );
  });

  it("lit les concurrents et leurs variantes", () => {
    const { brands } = parseCompetitors("Weidmann | WEI, weidmann,  Weidmann Menuiserie \nRenov Alsace|RENOV\n\nweidmann");
    assert.deepEqual(brands, [
      { name: "Weidmann", aliases: ["WEI", "Weidmann Menuiserie"] },
      { name: "Renov Alsace", aliases: ["RENOV"] },
    ]);
    assert.equal(formatCompetitors(brands), "Weidmann | WEI, Weidmann Menuiserie\nRenov Alsace | RENOV");
    assert.deepEqual(parseAliases("Axhome, , Ax home, axhome", "Ax'home"), ["Axhome", "Ax home"]);
  });

  it("horodate une entrée du journal", () => {
    const now = new Date("2026-10-09T18:00:00Z");
    assert.equal(journalTimestamp("2026-10-09", now), now.toISOString());
    assert.equal(journalTimestamp("", now), now.toISOString());
    assert.equal(journalTimestamp("2026-09-15", now), "2026-09-15T10:00:00.000Z");
    assert.equal(journalTimestamp("2026-10-20", now), null);
    assert.equal(journalTimestamp("2026-02-30", now), null);
  });
});
