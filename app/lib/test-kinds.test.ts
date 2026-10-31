import { describe, expect, it } from "vitest";
import { buildKanjiTestPayload } from "#mocks/factories/kanji";
import { buildPayload } from "#mocks/factories/payload";
import { isKanji, parseAnyPayload, readPayload } from "./test-kinds";

describe("parseAnyPayload", () => {
  it("accepts a grammar payload and a kanji payload, and returns each", () => {
    expect(parseAnyPayload(buildPayload())).toEqual({ ok: true, payload: buildPayload() });
    expect(parseAnyPayload(buildKanjiTestPayload())).toEqual({ ok: true, payload: buildKanjiTestPayload() });
  });

  it("checks a body with kind kanji against the kanji format, so its issues name kanji fields", () => {
    const result = parseAnyPayload({ ...buildKanjiTestPayload(), grammarPoints: [] });

    expect(result).toEqual({ ok: false, issues: [expect.objectContaining({ path: "(root)", message: expect.stringContaining("grammarPoints") })] });
  });

  it("checks any other body against the grammar format", () => {
    expect(parseAnyPayload({ kind: "vocab" })).toMatchObject({ ok: false, issues: expect.arrayContaining([expect.objectContaining({ path: "version" })]) });
  });
});

describe("readPayload", () => {
  it("reads a saved payload of either kind, and null for one in no current format", () => {
    expect(readPayload(buildKanjiTestPayload())).toEqual(buildKanjiTestPayload());
    expect(readPayload({ ...buildPayload(), version: 0 })).toBeNull();
  });
});

describe("isKanji", () => {
  it("tells a kanji payload from a grammar one", () => {
    expect([isKanji(buildKanjiTestPayload()), isKanji(buildPayload())]).toEqual([true, false]);
  });
});
