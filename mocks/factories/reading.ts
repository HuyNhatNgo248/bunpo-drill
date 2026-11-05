import type { ReadingPassage, ReadingQuestion, ReadingSection, ReadingTestPayload } from "~/lib/reading-payload";

/**
 * Builders for a reading set, the shapes in app/lib/reading-payload.ts. Each takes the fields to replace and fills the
 * rest, and every default passes the schema.
 */

/** The question on `buildReadingPassage()`'s underline: why the writer walks without the app. Answer 3. */
export function buildReadingQuestion(overrides: Partial<ReadingQuestion> = {}): ReadingQuestion {
  return {
    id: "q1",
    prompt: "<u>あえてアプリを閉じて歩く</u>とあるが、なぜか。",
    choices: ["道に迷うのは悪いことだから", "効率には価値がないから", "思いがけない発見は迷うときにあるから", "必ず新しい店に出会えるから"],
    answerIndex: 2,
    kind: "理由",
    traps: ["opposite", "over-general", null, "over-general"],
    evidence: "思いがけない店に出会う経験は、迷う余地があってこそ生まれる。",
    explanation: "The last sentence says new finds need room to get lost. 1 is the opposite; 2 and 4 go too far.",
    ...overrides,
  };
}

/** A 短文 passage with one underline, one （注） and one question. */
export function buildReadingPassage(overrides: Partial<ReadingPassage> = {}): ReadingPassage {
  return {
    blocks: [{ kind: "text", text: "道に迷うことはなくなった。しかし、私は<u>あえてアプリを閉じて歩く</u>。\n思いがけない店に出会う経験は、迷う余地があってこそ生まれる。" }],
    notes: [{ word: "余地", gloss: "何かをする余裕" }],
    tip: "The writer's view is in the last sentence.",
    questions: [buildReadingQuestion()],
    ...overrides,
  };
}

export function buildReadingSetSection(overrides: Partial<ReadingSection> = {}): ReadingSection {
  return { type: "reading-short", passages: [buildReadingPassage()], ...overrides };
}

/** 短文 1: one passage and one question. */
export function buildReadingPayload(overrides: Partial<ReadingTestPayload> = {}): ReadingTestPayload {
  return { version: 1, kind: "reading", title: "短文 1", level: "N2", sections: [buildReadingSetSection()], ...overrides };
}
