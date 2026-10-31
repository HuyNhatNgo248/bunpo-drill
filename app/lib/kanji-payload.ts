import { z } from "zod";
import { answerIndex, choices, LEVELS, questionId, type Level } from "./payload";

/**
 * The kanji formats, version 1, which Claude POSTs with the jlpt-kanji-quiz skill: a chapter of 漢字マスター (the words
 * its flashcards show), and a mock test on one chapter in the exam's two kanji 問題, 漢字読み and 表記.
 *
 * Like payload.ts for grammar, this file is the single source of truth for both: the API checks every POST with these
 * schemas, and `pnpm schema` writes the skill's chapter.schema.json and test.schema.json from them.
 */
export const KANJI_VERSION = 1;

const ONE_KANJI = /^\p{Script=Han}$/u;
const NO_KANJI = /^[^\p{Script=Han}]+$/u;
const WORD_ID = /^n[1-5]-c[1-9][0-9]*-.+$/;
/** The word a question is about, in its prompt: 【招待状】. */
const TARGET = /【([^【】]*)】/g;

/** The kanji of a word, in order, repeats included: 贈答品 → 贈, 答, 品. */
const kanjiOf = (text: string) => text.match(/\p{Script=Han}/gu) ?? [];

/**
 * A word's id, the same in a chapter and in the tests on it: the level, the chapter and the word.
 *
 * @example
 * wordId("N2", 1, "贈答品"); // -> "n2-c1-贈答品"
 */
export const wordId = (level: Level, chapter: number, word: string): string => `${level.toLowerCase()}-c${chapter}-${word}`;

const level = z.enum(LEVELS);
const chapterNumber = z.number().int().min(1).max(30).describe("The chapter of 漢字マスター (1章 → 1).");

const kun = z
  .array(z.string().min(1))
  .describe('Kun readings in hiragana, okurigana after a hyphen: ["おく-る"]. Empty when it has none.');
const on = z.array(z.string().min(1)).describe('On readings in katakana: ["ゾウ", "ソウ"]. Empty when it has none.');

export const chapterWordSchema = z.strictObject({
  word: z.string().min(1).max(20).describe('The word as the book writes it: "贈答品", "贈る".'),
  reading: z.string().regex(NO_KANJI).max(40).describe('Its reading in hiragana: "ぞうとうひん".'),
  meaning: z.string().min(1).max(80).describe('A short English meaning: "gifts, given and received".'),
  rare: z.boolean().optional().describe("true for a word the book marks △ (less common)."),
});

export const headwordSchema = z.strictObject({
  char: z.string().regex(ONE_KANJI).describe("The kanji the book teaches: 贈."),
  strokes: z.number().int().min(1).max(30).describe("Its stroke count, from the book: (18) → 18."),
  kun,
  on,
  words: z.array(chapterWordSchema).min(1).max(12).describe("Its example words, in the book's order. Each one contains the kanji."),
  examples: z
    .array(
      z.strictObject({
        sentence: z
          .string()
          .min(1)
          .max(80)
          .describe("A natural sentence with one of the kanji's words in 【 】, exactly once; a verb may be conjugated: \"友人の結婚祝いに、グラスを【贈った】。\"."),
        meaning: z.string().min(1).max(200).describe("The sentence in English."),
      }),
    )
    .max(5)
    .optional()
    .describe("Sentences the flashcards show with the kanji's words: 3, each new (not the book's), each on a different word."),
});

const chapterObject = z.strictObject({
  version: z.literal(KANJI_VERSION),
  level,
  chapter: chapterNumber,
  title: z.string().min(1).max(30).describe('The chapter title from the book: "生活-1".'),
  lessons: z
    .array(
      z.strictObject({
        title: z.string().min(1).max(30).describe('The lesson title: "ギフト".'),
        page: z.number().int().min(1).max(400).describe("Its page in the book."),
        kanji: z.array(headwordSchema).min(1).max(12),
      }),
    )
    .min(1)
    .max(12)
    .describe("The chapter's lessons, one per page, in the book's order."),
  otherKanji: z
    .array(z.strictObject({ char: z.string().regex(ONE_KANJI), kun, on }))
    .max(300)
    .describe("Every kanji in the words that is not one of the chapter's headwords (答 and 品 of 贈答品), with its readings."),
});

export const kanjiChapterSchema = chapterObject
  .superRefine(checkChapter)
  .meta({
    title: "漢字マスター chapter",
    description: [
      "Body of POST /api/kanji/chapters: the words of one chapter, for its flashcards. Sending a chapter again replaces it.",
      "Rules the server also enforces:",
      "1. Every word contains its headword, and a word appears once in the chapter.",
      "2. Every kanji in a word is a headword of the chapter or is listed in otherKanji.",
      "3. Every example sentence has one 【…】, around a word with its kanji.",
    ].join("\n"),
  });

const explanation = z
  .string()
  .min(1)
  .max(400)
  .optional()
  .describe("Shown under the answer on the results page. In English, one or two sentences: why the answer is right and which trap the others set.");

const kanjiQuestionSchema = z.strictObject({
  id: questionId,
  wordId: z.string().regex(WORD_ID).describe("The id of the word (from words) this question tests."),
  prompt: z
    .string()
    .min(1)
    .describe("One sentence with the tested word in 【 】, exactly once: in kanji for kanji-reading (【招待状】), in hiragana for kanji-writing (【じょうしゃけん】). A verb may be conjugated (【届けて】)."),
  choices,
  answerIndex,
  explanation,
});

const testObject = z.strictObject({
  version: z.literal(KANJI_VERSION),
  kind: z.literal("kanji"),
  title: z.string().min(1).max(60),
  level,
  chapter: chapterNumber,
  words: z
    .array(
      z.strictObject({
        id: z.string().regex(WORD_ID).describe('wordId of the word: "n2-c1-招待状".'),
        word: z.string().min(1).max(20),
        reading: z.string().regex(NO_KANJI).max(40),
      }),
    )
    .min(1)
    .max(60)
    .describe("The chapter words this test covers, as the chapter writes them."),
  sections: z
    .tuple([
      z.strictObject({ type: z.literal("kanji-reading"), questions: z.array(kanjiQuestionSchema).min(1).max(30) }),
      z.strictObject({ type: z.literal("kanji-writing"), questions: z.array(kanjiQuestionSchema).min(1).max(30) }),
    ])
    .describe("Always these 2 sections, in this order: 漢字読み, then 表記."),
});

export const kanjiTestPayloadSchema = testObject
  .superRefine(checkTest)
  .meta({
    title: "Kanji mock test payload",
    description: [
      "Body of POST /api/tests for a kanji test, version 1. The chapter must be POSTed to /api/kanji/chapters first.",
      "Rules the server also enforces:",
      '1. Each word id is "<level>-c<chapter>-<word>", the word is in the chapter, and every word is tested.',
      '2. Question ids run "q1", "q2", … with no gaps, and every wordId is listed in words.',
      "3. A prompt has exactly one 【…】. In kanji-reading it holds the word's kanji, and the 4 choices are readings without kanji; in kanji-writing it holds no kanji, and every choice has some.",
      "4. The right choice of a kanji-writing question contains the word's kanji. The 4 choices are all different.",
      "Standard size: 5 kanji-reading and 5 kanji-writing questions (q1–q10), as in the exam.",
    ].join("\n"),
  });

export type KanjiChapter = z.infer<typeof kanjiChapterSchema>;
export type ChapterWord = z.infer<typeof chapterWordSchema>;
export type KanjiTestPayload = z.infer<typeof kanjiTestPayloadSchema>;
export type KanjiQuestion = z.infer<typeof kanjiQuestionSchema>;

/**
 * The sentence of a kanji question around its word, for the page to underline the word.
 *
 * @example
 * splitTarget("駅で【じょうしゃけん】を買った。"); // -> { before: "駅で", word: "じょうしゃけん", after: "を買った。" }
 */
export function splitTarget(prompt: string): { before: string; word: string; after: string } {
  const [before = "", rest = ""] = prompt.split("【");
  const [word = "", after = ""] = rest.split("】");
  return { before, word, after };
}

// The checks take the shapes before refinement, so a schema's type doesn't depend on its own check.
type RawChapter = z.infer<typeof chapterObject>;

function checkChapter(chapter: RawChapter, ctx: z.RefinementCtx) {
  const known = new Set([...chapter.lessons.flatMap((lesson) => lesson.kanji.map((k) => k.char)), ...chapter.otherKanji.map((k) => k.char)]);
  const seen = new Set<string>();
  chapter.lessons.forEach((lesson, l) =>
    lesson.kanji.forEach((headword, k) =>
      headword.words.forEach(({ word }, w) => {
        const path = ["lessons", l, "kanji", k, "words", w, "word"];
        if (!word.includes(headword.char)) ctx.addIssue({ code: "custom", path, message: `"${word}" does not contain ${headword.char}.` });
        if (seen.has(word)) ctx.addIssue({ code: "custom", path, message: `"${word}" is in the chapter twice.` });
        seen.add(word);
        const missing = kanjiOf(word).filter((char) => !known.has(char));
        if (missing.length) ctx.addIssue({ code: "custom", path, message: `Add ${[...new Set(missing)].join(", ")} to otherKanji.` });
      }),
    ),
  );
  chapter.lessons.forEach((lesson, l) =>
    lesson.kanji.forEach((headword, k) =>
      headword.examples?.forEach(({ sentence }, e) => {
        const targets = [...sentence.matchAll(TARGET)].map((match) => match[1]!);
        if (targets.length !== 1 || !targets[0]!.includes(headword.char)) {
          const path = ["lessons", l, "kanji", k, "examples", e, "sentence"];
          ctx.addIssue({ code: "custom", path, message: `The sentence must contain one 【…】 around a word with ${headword.char}.` });
        }
      }),
    ),
  );
}

type RawTest = z.infer<typeof testObject>;

function checkTest(payload: RawTest, ctx: z.RefinementCtx) {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });

  const words = new Map<string, { word: string; reading: string }>();
  payload.words.forEach((word, i) => {
    const expected = wordId(payload.level, payload.chapter, word.word);
    if (word.id !== expected) issue(["words", i, "id"], `Expected "${expected}" for this level, chapter and word.`);
    if (words.has(word.id)) issue(["words", i, "id"], `Duplicate word "${word.id}".`);
    words.set(word.id, word);
  });

  const tested = new Set<string>();
  let num = 0;
  payload.sections.forEach((section, s) =>
    section.questions.forEach((question, q) => {
      num += 1;
      const path = ["sections", s, "questions", q];
      if (question.id !== `q${num}`) issue([...path, "id"], `Expected "q${num}" (ids run q1, q2, … in order).`);
      if (new Set(question.choices).size !== question.choices.length) issue(path, "The 4 options must all be different.");
      tested.add(question.wordId);
      const word = words.get(question.wordId);
      if (!word) return issue([...path, "wordId"], `"${question.wordId}" is not in words.`);

      const targets = [...question.prompt.matchAll(TARGET)].map((match) => match[1]!);
      if (targets.length !== 1) return issue([...path, "prompt"], "The prompt must contain one 【…】 around the tested word.");
      const target = targets[0]!;
      const right = question.choices[question.answerIndex]!;
      if (section.type === "kanji-reading") {
        if (!kanjiOf(word.word).every((char) => target.includes(char))) issue([...path, "prompt"], `【${target}】 must be ${word.word} in kanji.`);
        if (!question.choices.every((choice) => NO_KANJI.test(choice))) issue([...path, "choices"], "Readings are written without kanji.");
      } else {
        if (!NO_KANJI.test(target)) issue([...path, "prompt"], `【${target}】 must be ${word.word} in hiragana, without kanji.`);
        if (!question.choices.every((choice) => kanjiOf(choice).length > 0)) issue([...path, "choices"], "Every spelling must use kanji.");
        if (!kanjiOf(word.word).every((char) => right.includes(char))) issue([...path, "answerIndex"], `The right choice must be written with ${word.word}'s kanji.`);
      }
    }),
  );

  payload.words.forEach((word, i) => {
    if (!tested.has(word.id)) issue(["words", i], `"${word.id}" is not tested by any question.`);
  });
}
