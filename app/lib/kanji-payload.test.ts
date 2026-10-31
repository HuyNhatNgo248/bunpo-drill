import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  buildChapterWord,
  buildHeadword,
  buildKanjiChapter,
  buildKanjiReadingQuestion,
  buildKanjiTestPayload,
  buildKanjiWritingQuestion,
  buildLesson,
  buildReadingSection,
  buildWritingSection,
  WORD_ID,
} from "#mocks/factories/kanji";
import { kanjiChapterSchema, kanjiTestPayloadSchema, splitTarget, wordId } from "./kanji-payload";

/** The paths and messages a schema reports, or a failure when it accepts the input. */
function issuesOf(schema: z.ZodType, input: unknown) {
  const result = schema.safeParse(input);
  if (result.success) throw new Error("expected the schema to reject the input");
  return result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
}

/** A test whose two questions are `reading` and `writing`. */
const testWith = (reading: Partial<Parameters<typeof buildKanjiReadingQuestion>[0]>, writing: Partial<Parameters<typeof buildKanjiWritingQuestion>[0]> = {}) =>
  buildKanjiTestPayload({
    sections: [buildReadingSection({ questions: [buildKanjiReadingQuestion(reading)] }), buildWritingSection({ questions: [buildKanjiWritingQuestion(writing)] })],
  });

describe("kanjiChapterSchema", () => {
  it("accepts a chapter that keeps every rule", () => {
    const chapter = buildKanjiChapter();

    expect(kanjiChapterSchema.parse(chapter)).toEqual(chapter);
  });

  describe("rule 1: the words", () => {
    it("reports a word that does not contain its headword", () => {
      const chapter = buildKanjiChapter({ lessons: [buildLesson({ kanji: [buildHeadword({ char: "贈" })] })] });

      expect(issuesOf(kanjiChapterSchema, { ...chapter, otherKanji: [...chapter.otherKanji, { char: "招", kun: [], on: [] }] })).toEqual([
        { path: "lessons.0.kanji.0.words.0.word", message: '"招待状" does not contain 贈.' },
      ]);
    });

    it("reports a word that is in the chapter twice", () => {
      const twice = buildHeadword({ words: [buildChapterWord(), buildChapterWord()] });

      expect(issuesOf(kanjiChapterSchema, buildKanjiChapter({ lessons: [buildLesson({ kanji: [twice] })] }))).toEqual([
        { path: "lessons.0.kanji.0.words.1.word", message: '"招待状" is in the chapter twice.' },
      ]);
    });
  });

  describe("rule 2: the readings of every kanji", () => {
    it("reports a kanji that is neither a headword nor in otherKanji, so a card would miss its readings", () => {
      expect(issuesOf(kanjiChapterSchema, buildKanjiChapter({ otherKanji: [{ char: "待", kun: ["ま-つ"], on: ["タイ"] }] }))).toEqual([
        { path: "lessons.0.kanji.0.words.0.word", message: "Add 状 to otherKanji." },
      ]);
    });
  });
});

describe("kanjiTestPayloadSchema", () => {
  it("accepts a test that keeps every rule", () => {
    const payload = buildKanjiTestPayload();

    expect(kanjiTestPayloadSchema.parse(payload)).toEqual(payload);
  });

  describe("rule 1: the words", () => {
    it("reports a word id that does not match the level, the chapter and the word", () => {
      const payload = buildKanjiTestPayload({ words: [{ id: "n2-c2-招待状", word: "招待状", reading: "しょうたいじょう" }] });

      expect(issuesOf(kanjiTestPayloadSchema, payload)).toContainEqual({
        path: "words.0.id",
        message: `Expected "${WORD_ID}" for this level, chapter and word.`,
      });
    });

    it("reports a word that no question tests", () => {
      const payload = buildKanjiTestPayload({
        words: [
          { id: WORD_ID, word: "招待状", reading: "しょうたいじょう" },
          { id: "n2-c1-招く", word: "招く", reading: "まねく" },
        ],
      });

      expect(issuesOf(kanjiTestPayloadSchema, payload)).toEqual([{ path: "words.1", message: '"n2-c1-招く" is not tested by any question.' }]);
    });
  });

  describe("rule 2: the questions", () => {
    it("reports question ids that are out of order", () => {
      expect(issuesOf(kanjiTestPayloadSchema, testWith({}, { id: "q3" }))).toEqual([
        { path: "sections.1.questions.0.id", message: 'Expected "q2" (ids run q1, q2, … in order).' },
      ]);
    });

    it("reports a question on a word that is not listed", () => {
      expect(issuesOf(kanjiTestPayloadSchema, testWith({ wordId: "n2-c1-贈答品" }))).toEqual([
        { path: "sections.0.questions.0.wordId", message: '"n2-c1-贈答品" is not in words.' },
      ]);
    });
  });

  describe("rule 3: the 【】 in a prompt", () => {
    it("reports a prompt without 【】, or with two", () => {
      const message = "The prompt must contain one 【…】 around the tested word.";

      expect(issuesOf(kanjiTestPayloadSchema, testWith({ prompt: "招待状をいただいた。" }))).toEqual([{ path: "sections.0.questions.0.prompt", message }]);
      expect(issuesOf(kanjiTestPayloadSchema, testWith({ prompt: "【招待状】と【招待状】" }))).toEqual([{ path: "sections.0.questions.0.prompt", message }]);
    });

    it("reports a 漢字読み target without the word's kanji, and a reading written in kanji", () => {
      expect(issuesOf(kanjiTestPayloadSchema, testWith({ prompt: "【招く】" }))).toEqual([
        { path: "sections.0.questions.0.prompt", message: "【招く】 must be 招待状 in kanji." },
      ]);
      expect(issuesOf(kanjiTestPayloadSchema, testWith({ choices: ["しょたいじょう", "しょだいじょう", "しょうたいじょう", "招待"] }))).toEqual([
        { path: "sections.0.questions.0.choices", message: "Readings are written without kanji." },
      ]);
    });

    it("lets a 漢字読み target be a conjugated verb", () => {
      const words = [{ id: "n2-c1-届ける", word: "届ける", reading: "とどける" }];
      const reading = buildKanjiReadingQuestion({ wordId: "n2-c1-届ける", prompt: "荷物を【届けて】ください。", choices: ["とどけて", "ととけて", "あずけて", "うけて"], answerIndex: 0 });
      const writing = buildKanjiWritingQuestion({ wordId: "n2-c1-届ける", prompt: "書類を【とどけた】。", choices: ["届けた", "屈けた", "居けた", "庙けた"], answerIndex: 0 });

      expect(kanjiTestPayloadSchema.safeParse(buildKanjiTestPayload({ words, sections: [buildReadingSection({ questions: [reading] }), buildWritingSection({ questions: [writing] })] })).success).toBe(true);
    });

    it("reports a 表記 target in kanji, and a spelling without kanji", () => {
      expect(issuesOf(kanjiTestPayloadSchema, testWith({}, { prompt: "【招待状】を送った。" }))).toEqual([
        { path: "sections.1.questions.0.prompt", message: "【招待状】 must be 招待状 in hiragana, without kanji." },
      ]);
      expect(issuesOf(kanjiTestPayloadSchema, testWith({}, { choices: ["招待状", "招持状", "紹待状", "しょうたいじょう"] }))).toEqual([
        { path: "sections.1.questions.0.choices", message: "Every spelling must use kanji." },
      ]);
    });
  });

  describe("rule 4: the choices", () => {
    it("reports a right 表記 choice that is not written with the word's kanji", () => {
      expect(issuesOf(kanjiTestPayloadSchema, testWith({}, { answerIndex: 1 }))).toEqual([
        { path: "sections.1.questions.0.answerIndex", message: "The right choice must be written with 招待状's kanji." },
      ]);
    });

    it("reports a question whose 4 choices are not all different", () => {
      expect(issuesOf(kanjiTestPayloadSchema, testWith({ choices: ["しょうたいじょう", "しょうたいじょう", "しょたいじょう", "しょだいじょう"] }))).toEqual([
        { path: "sections.0.questions.0", message: "The 4 options must all be different." },
      ]);
    });
  });
});

describe("wordId", () => {
  it("joins the level, the chapter and the word", () => {
    expect(wordId("N2", 12, "贈答品")).toBe("n2-c12-贈答品");
  });
});

describe("splitTarget", () => {
  it("splits a prompt around its 【】 word", () => {
    expect(splitTarget("駅で【じょうしゃけん】を買った。")).toEqual({ before: "駅で", word: "じょうしゃけん", after: "を買った。" });
  });

  it("gives empty text before or after a word at the start or the end", () => {
    expect(splitTarget("【渡航】")).toEqual({ before: "", word: "渡航", after: "" });
  });
});

describe("the kanji skill's schema files", () => {
  // After a change to a schema, `pnpm schema` rewrites the files.
  it("match the chapter schema, so Claude and the app agree on the format", async () => {
    const schema = {
      ...z.toJSONSchema(kanjiChapterSchema, { target: "draft-2020-12", unrepresentable: "any" }),
      $id: "https://bunpo-drill.local/schema/kanji-chapter.v1.json",
    };

    await expect(`${JSON.stringify(schema, null, 2)}\n`).toMatchFileSnapshot("../../.claude/skills/jlpt-kanji-quiz/chapter.schema.json");
  });

  it("match the kanji test schema", async () => {
    const schema = {
      ...z.toJSONSchema(kanjiTestPayloadSchema, { target: "draft-2020-12", unrepresentable: "any" }),
      $id: "https://bunpo-drill.local/schema/kanji-test.v1.json",
    };

    await expect(`${JSON.stringify(schema, null, 2)}\n`).toMatchFileSnapshot("../../.claude/skills/jlpt-kanji-quiz/test.schema.json");
  });
});
