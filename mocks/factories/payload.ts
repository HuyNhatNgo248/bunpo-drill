import type { FillBlankQuestion, GrammarPoint, PassageQuestion, SentenceOrderQuestion, TestPayload } from "~/lib/payload";

/**
 * Builders for the mock-test payload in app/lib/payload.ts.
 *
 * `buildPayload()` is the smallest payload that `parsePayload` accepts: one grammar point, and one
 * question in each section (q1 fill-blank, q2 sentence-order, q3 passage). Each builder takes the
 * fields to replace and fills the rest.
 */

type FillBlankSection = TestPayload["sections"][0];
type SentenceOrderSection = TestPayload["sections"][1];
type PassageSection = TestPayload["sections"][2];
type Passage = PassageSection["passages"][number];

/** The grammar point that every built question tests. */
export const GRAMMAR_ID = "n2-w1-d1-g1";

/**
 * @example
 * buildGrammarPoint({ id: "n2-w1-d1-g2", number: 2 }).number; // -> 2
 */
export function buildGrammarPoint(overrides: Partial<GrammarPoint> = {}): GrammarPoint {
  return {
    id: GRAMMAR_ID,
    week: 1,
    day: 1,
    number: 1,
    pattern: "〜かいがある",
    meaning: "worth the effort",
    ...overrides,
  };
}

/** The correct choice is 3 (index 2). */
export function buildFillBlankQuestion(overrides: Partial<FillBlankQuestion> = {}): FillBlankQuestion {
  return {
    id: "q1",
    grammarId: GRAMMAR_ID,
    prompt: "練習した（　　）、合格できた。",
    choices: ["かいもなく", "かいがなく", "かいがあって", "までして"],
    answerIndex: 2,
    ...overrides,
  };
}

/** The ★ is slot 3, and the correct piece for it is index 2 (かいが). */
export function buildSentenceOrderQuestion(overrides: Partial<SentenceOrderQuestion> = {}): SentenceOrderQuestion {
  return {
    id: "q2",
    grammarId: GRAMMAR_ID,
    before: "彼は",
    after: "合格した。",
    pieces: ["練習した", "毎日", "かいが", "あって"],
    correctOrder: [1, 0, 2, 3],
    starSlot: 3,
    ...overrides,
  };
}

/** The correct choice is 1 (index 0). */
export function buildPassageQuestion(overrides: Partial<PassageQuestion> = {}): PassageQuestion {
  return {
    id: "q3",
    blank: 3,
    grammarId: GRAMMAR_ID,
    choices: ["かいがあって", "かいもなく", "ばかりに", "どころか"],
    answerIndex: 0,
    ...overrides,
  };
}

export function buildFillBlankSection(overrides: Partial<FillBlankSection> = {}): FillBlankSection {
  return { type: "fill-blank", questions: [buildFillBlankQuestion()], ...overrides };
}

export function buildSentenceOrderSection(overrides: Partial<SentenceOrderSection> = {}): SentenceOrderSection {
  return { type: "sentence-order", questions: [buildSentenceOrderQuestion()], ...overrides };
}

/** One passage with the [3] marker of its one question. */
export function buildPassage(overrides: Partial<Passage> = {}): Passage {
  return { passage: "毎日練習した[3]、合格できた。", questions: [buildPassageQuestion()], ...overrides };
}

export function buildPassageSection(overrides: Partial<PassageSection> = {}): PassageSection {
  return { type: "passage", passages: [buildPassage()], ...overrides };
}

/**
 * @example
 * buildPayload({ title: "第2週" }).title; // -> "第2週"
 */
export function buildPayload(overrides: Partial<TestPayload> = {}): TestPayload {
  return {
    version: 1,
    title: "第1週 1日目",
    level: "N2",
    grammarPoints: [buildGrammarPoint()],
    sections: [buildFillBlankSection(), buildSentenceOrderSection(), buildPassageSection()],
    ...overrides,
  };
}
