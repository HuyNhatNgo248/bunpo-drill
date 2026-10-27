import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  buildFillBlankQuestion,
  buildFillBlankSection,
  buildGrammarPoint,
  buildPassage,
  buildPassageQuestion,
  buildPassageSection,
  buildPayload,
  buildSentenceOrderQuestion,
  buildSentenceOrderSection,
  GRAMMAR_ID,
} from "#mocks/factories/payload";
import { BLANK, parsePayload, splitPassage, testPayloadSchema } from "./payload";

/** A second grammar point on the same day, for the cases that need two. */
const SECOND_POINT = buildGrammarPoint({
  id: "n2-w1-d1-g2",
  number: 2,
  pattern: "〜ばかりか",
});

/** The issues `parsePayload` reports, or a failure when it accepts the payload. */
function issuesOf(input: unknown) {
  const result = parsePayload(input);
  if (result.ok) throw new Error("expected parsePayload to reject the payload");
  return result.issues;
}

describe("parsePayload", () => {
  it("accepts a payload that keeps every rule, and returns it", () => {
    const payload = buildPayload();

    expect(parsePayload(payload)).toEqual({ ok: true, payload });
  });

  describe("the shape", () => {
    it("reports a value that is not a payload at the root", () => {
      expect(issuesOf("not a payload")).toEqual([
        { path: "(root)", message: expect.any(String) },
      ]);
    });

    it("reports a field that breaks its schema, by its path", () => {
      expect(issuesOf(buildPayload({ title: "" }))).toContainEqual({
        path: "title",
        message: expect.any(String),
      });
    });

    it("reports a value issue and a rule issue together, so one answer lists both", () => {
      const issues = issuesOf(
        buildPayload({
          title: "",
          grammarPoints: [buildGrammarPoint({ week: 2 })],
        }),
      );

      expect(issues.map((issue) => issue.path)).toEqual([
        "title",
        "grammarPoints.0.id",
      ]);
    });

    it("does not run the cross-field rules when a section is missing, so they do not crash on it", () => {
      const issues = issuesOf({
        version: 1,
        title: "第1週",
        level: "N2",
        grammarPoints: [buildGrammarPoint()],
      });

      expect(issues.map((issue) => issue.path)).toEqual(["sections"]);
    });
  });

  describe("rule 1: grammar point ids", () => {
    it("reports an id that does not match the level, week, day and number", () => {
      const payload = buildPayload({
        grammarPoints: [buildGrammarPoint({ week: 2 })],
      });

      expect(issuesOf(payload)).toContainEqual({
        path: "grammarPoints.0.id",
        message: 'Expected "n2-w2-d1-g1" for this level, week, day and number.',
      });
    });

    it("reports a grammar point that is listed twice", () => {
      const payload = buildPayload({
        grammarPoints: [buildGrammarPoint(), buildGrammarPoint()],
      });

      expect(issuesOf(payload)).toContainEqual({
        path: "grammarPoints.1.id",
        message: `Duplicate grammar point "${GRAMMAR_ID}".`,
      });
    });
  });

  describe("rule 2: grammar ids of the questions", () => {
    it("reports a question that tests a grammar point the payload does not list", () => {
      const fill = buildFillBlankSection({
        questions: [buildFillBlankQuestion({ grammarId: "n2-w9-d6-g4" })],
      });
      const payload = buildPayload({
        sections: [fill, buildSentenceOrderSection(), buildPassageSection()],
      });

      expect(issuesOf(payload)).toContainEqual({
        path: "sections.0.questions.0.grammarId",
        message: '"n2-w9-d6-g4" is not in grammarPoints.',
      });
    });

    it("reports a grammar point that no question tests", () => {
      const payload = buildPayload({
        grammarPoints: [buildGrammarPoint(), SECOND_POINT],
      });

      expect(issuesOf(payload)).toEqual([
        {
          path: "grammarPoints.1",
          message: '"n2-w1-d1-g2" is not tested by any question.',
        },
      ]);
    });
  });

  describe("rule 3: question ids", () => {
    it("reports an id that leaves a gap in q1, q2, …", () => {
      const order = buildSentenceOrderSection({
        questions: [buildSentenceOrderQuestion({ id: "q5" })],
      });
      const payload = buildPayload({
        sections: [buildFillBlankSection(), order, buildPassageSection()],
      });

      expect(issuesOf(payload)).toEqual([
        {
          path: "sections.1.questions.0.id",
          message: 'Expected "q2" (ids run q1, q2, … in order).',
        },
      ]);
    });
  });

  describe("rule 4: the fill-blank prompt", () => {
    it("reports a prompt that holds the blank more than once", () => {
      const fill = buildFillBlankSection({
        questions: [buildFillBlankQuestion({ prompt: `${BLANK}と${BLANK}` })],
      });
      const payload = buildPayload({
        sections: [fill, buildSentenceOrderSection(), buildPassageSection()],
      });

      expect(issuesOf(payload)).toEqual([
        {
          path: "sections.0.questions.0.prompt",
          message: `The prompt must contain ${BLANK} exactly once.`,
        },
      ]);
    });
  });

  describe("rule 5: the options of a question", () => {
    it("reports choices that repeat", () => {
      const question = buildFillBlankQuestion({
        choices: ["かいがあって", "かいがあって", "ばかりに", "どころか"],
      });
      const payload = buildPayload({
        sections: [
          buildFillBlankSection({ questions: [question] }),
          buildSentenceOrderSection(),
          buildPassageSection(),
        ],
      });

      expect(issuesOf(payload)).toEqual([
        {
          path: "sections.0.questions.0",
          message: "The 4 options must all be different.",
        },
      ]);
    });

    it("reports pieces that repeat", () => {
      const question = buildSentenceOrderQuestion({
        pieces: ["毎日", "毎日", "かいが", "あって"],
      });
      const payload = buildPayload({
        sections: [
          buildFillBlankSection(),
          buildSentenceOrderSection({ questions: [question] }),
          buildPassageSection(),
        ],
      });

      expect(issuesOf(payload)).toEqual([
        {
          path: "sections.1.questions.0",
          message: "The 4 options must all be different.",
        },
      ]);
    });
  });

  describe("rule 6: correctOrder", () => {
    it("reports an order that is not a permutation of 0, 1, 2, 3", () => {
      const question = buildSentenceOrderQuestion({
        correctOrder: [0, 0, 1, 2],
      });
      const payload = buildPayload({
        sections: [
          buildFillBlankSection(),
          buildSentenceOrderSection({ questions: [question] }),
          buildPassageSection(),
        ],
      });

      expect(issuesOf(payload)).toEqual([
        {
          path: "sections.1.questions.0.correctOrder",
          message: "correctOrder must be a permutation of 0,1,2,3.",
        },
      ]);
    });
  });

  describe("rule 7: passage blanks and markers", () => {
    it("reports a blank number that is not the question number", () => {
      const passage = buildPassage({
        passage: "毎日練習した[4]、合格できた。",
        questions: [buildPassageQuestion({ blank: 4 })],
      });
      const payload = buildPayload({
        sections: [
          buildFillBlankSection(),
          buildSentenceOrderSection(),
          buildPassageSection({ passages: [passage] }),
        ],
      });

      expect(issuesOf(payload)).toEqual([
        {
          path: "sections.2.passages.0.questions.0.blank",
          message: "Expected 3 (the question number).",
        },
      ]);
    });

    it("reports a passage that has no marker for its question", () => {
      const passage = buildPassage({ passage: "毎日練習して、合格できた。" });
      const payload = buildPayload({
        sections: [
          buildFillBlankSection(),
          buildSentenceOrderSection(),
          buildPassageSection({ passages: [passage] }),
        ],
      });

      expect(issuesOf(payload)).toEqual([
        {
          path: "sections.2.passages.0.passage",
          message: "Markers (none) must be exactly [3], once each, in order.",
        },
      ]);
    });

    it("reports a marker that appears twice", () => {
      const passage = buildPassage({ passage: "[3]毎日練習した[3]。" });
      const payload = buildPayload({
        sections: [
          buildFillBlankSection(),
          buildSentenceOrderSection(),
          buildPassageSection({ passages: [passage] }),
        ],
      });

      expect(issuesOf(payload)).toEqual([
        {
          path: "sections.2.passages.0.passage",
          message: "Markers [3] [3] must be exactly [3], once each, in order.",
        },
      ]);
    });
  });
});

describe("splitPassage", () => {
  it("splits a passage into text runs and the numbers of its blanks", () => {
    expect(splitPassage("毎日[31]練習して[32]、合格した。")).toEqual([
      { kind: "text", text: "毎日" },
      { kind: "blank", num: 31 },
      { kind: "text", text: "練習して" },
      { kind: "blank", num: 32 },
      { kind: "text", text: "、合格した。" },
    ]);
  });

  it("adds no empty text run for a marker at the start or the end", () => {
    expect(splitPassage("[1]毎日[2]")).toEqual([
      { kind: "blank", num: 1 },
      { kind: "text", text: "毎日" },
      { kind: "blank", num: 2 },
    ]);
  });

  it("returns one text run for a passage with no markers", () => {
    expect(splitPassage("毎日練習した。")).toEqual([
      { kind: "text", text: "毎日練習した。" },
    ]);
  });
});

describe("the quiz skill's schema.json", () => {
  it("matches the payload schema, so Claude and the app agree on the format", async () => {
    // After a change to the schema, `pnpm schema` rewrites the file.
    const schema = {
      ...z.toJSONSchema(testPayloadSchema, { target: "draft-2020-12", unrepresentable: "any" }),
      $id: "https://bunpo-drill.local/schema/test-payload.v1.json",
    };

    await expect(`${JSON.stringify(schema, null, 2)}\n`).toMatchFileSnapshot("../../.claude/skills/jlpt-grammar-quiz/schema.json");
  });
});
