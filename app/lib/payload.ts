import { z } from "zod";

/**
 * The standard mock-test payload, version 1.
 *
 * This file is the single source of truth for the format. The API validates
 * every POST with `parsePayload`, and `pnpm schema` generates the skill's
 * `.claude/skills/jlpt-grammar-quiz/schema.json` from it, so Claude and the
 * app always agree on the shape.
 */
export const PAYLOAD_VERSION = 1;

/** The blank in a 文法形式の判断 prompt: full-width parentheses around two ideographic spaces. */
export const BLANK = "（　　）";

export const LEVELS = ["N3", "N2"] as const;
export type Level = (typeof LEVELS)[number];

export const SECTION_TYPES = ["fill-blank", "sentence-order", "passage"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

const GRAMMAR_ID = /^n[1-5]-w[1-9]-d[1-6]-g[1-4]$/;
const QUESTION_ID = /^q[1-9][0-9]*$/;
const PASSAGE_MARKER = /\[(\d+)\]/g;

const questionId = z
  .string()
  .regex(QUESTION_ID)
  .describe('Sequential across the whole test in section order: "q1", "q2", … with no gaps.');

const grammarId = z
  .string()
  .regex(GRAMMAR_ID)
  .describe("The id of the grammar point (from grammarPoints) this question tests.");

const choices = z
  .array(z.string().min(1))
  .length(4)
  .describe("Exactly 4 different options, shown to the learner as 1–4.");

const answerIndex = z
  .number()
  .int()
  .min(0)
  .max(3)
  .describe("0-based index of the correct option in choices.");

export const grammarPointSchema = z
  .strictObject({
    id: z
      .string()
      .regex(GRAMMAR_ID)
      .describe('"<level>-w<week>-d<day>-g<number>", lower case, e.g. "n3-w5-d1-g2". Must match level, week, day and number.'),
    week: z.number().int().min(1).max(9).describe("Week in the 文法ノート (第5週 → 5)."),
    day: z.number().int().min(1).max(6).describe("Day within the week (3日目 → 3). Day 7 is 実戦問題 and has no patterns."),
    number: z.number().int().min(1).max(4).describe("Position within the day, ① → 1 … ④ → 4."),
    pattern: z.string().min(1).describe('The pattern exactly as the note heading writes it, e.g. "〜ばかりか".'),
    meaning: z.string().min(1).describe('Short English meaning, e.g. "not only … but also".'),
  })
  .describe("A grammar point from the 文法ノート that this test covers.");

export const fillBlankQuestionSchema = z.strictObject({
  id: questionId,
  grammarId,
  prompt: z
    .string()
    .regex(new RegExp(BLANK))
    .describe(`One sentence containing the blank ${BLANK} exactly once.`),
  choices,
  answerIndex,
});

export const sentenceOrderQuestionSchema = z.strictObject({
  id: questionId,
  grammarId,
  before: z.string().min(1).describe("Sentence text before the 4 slots."),
  after: z.string().min(1).describe("Sentence text after the 4 slots, usually ending in 。"),
  pieces: z
    .array(z.string().min(1))
    .length(4)
    .describe("The 4 different pieces in scrambled order, shown as 1–4."),
  correctOrder: z
    .array(z.number().int().min(0).max(3))
    .length(4)
    .describe("0-based piece indices in the correct slot order; a permutation of 0,1,2,3."),
  starSlot: z
    .number()
    .int()
    .min(1)
    .max(4)
    .describe("1-based slot that holds ★. Only the piece in this slot is graded."),
});

export const passageQuestionSchema = z.strictObject({
  id: questionId,
  blank: z.number().int().min(1).describe("Equals this question's number (q7 → 7) and its [7] marker in the passage."),
  grammarId,
  choices,
  answerIndex,
});

export const fillBlankSectionSchema = z.strictObject({
  type: z.literal("fill-blank"),
  questions: z.array(fillBlankQuestionSchema).min(1).max(30),
});

export const sentenceOrderSectionSchema = z.strictObject({
  type: z.literal("sentence-order"),
  questions: z.array(sentenceOrderQuestionSchema).min(1).max(30),
});

export const passageSchema = z.strictObject({
  passage: z
    .string()
    .min(1)
    .describe("A short passage with one [n] marker per blank, where n is the question number, e.g. [31]."),
  questions: z.array(passageQuestionSchema).min(1).max(5),
});

export const passageSectionSchema = z.strictObject({
  type: z.literal("passage"),
  passages: z
    .array(passageSchema)
    .min(1)
    .max(6)
    .describe("Each passage has its own text and 1–5 blanks. Standard: 3 passages × 5 blanks."),
});

export const testPayloadSchema = z
  .strictObject({
    version: z.literal(PAYLOAD_VERSION),
    title: z.string().min(1).max(60),
    level: z.enum(LEVELS),
    grammarPoints: z.array(grammarPointSchema).min(1).max(90),
    sections: z
      .tuple([fillBlankSectionSchema, sentenceOrderSectionSchema, passageSectionSchema])
      .describe("Always these 3 sections, in this order: fill-blank, sentence-order, passage."),
  })
  .superRefine(checkPayload)
  .meta({
    title: "文法ドリル mock test payload",
    description: [
      "Body of POST /api/tests. Version 1 of the standard format.",
      "Rules the server also enforces:",
      "1. grammarPoints ids are unique and match level/week/day/number.",
      "2. Every question's grammarId is listed in grammarPoints, and every grammar point is tested at least once.",
      '3. Question ids run "q1", "q2", … in section order with no gaps.',
      `4. A fill-blank prompt contains ${BLANK} exactly once.`,
      "5. The 4 choices (or pieces) of a question are all different.",
      "6. correctOrder is a permutation of 0,1,2,3.",
      "7. Each passage question's blank equals its question number, and its passage has exactly one [n] marker per question and no others.",
      "Standard size: 15 fill-blank, 15 sentence-order, 3 passages × 5 blanks (q1–q45).",
    ].join("\n"),
  });

export type GrammarPoint = z.infer<typeof grammarPointSchema>;
export type FillBlankQuestion = z.infer<typeof fillBlankQuestionSchema>;
export type SentenceOrderQuestion = z.infer<typeof sentenceOrderQuestionSchema>;
export type PassageQuestion = z.infer<typeof passageQuestionSchema>;
export type TestPayload = z.infer<typeof testPayloadSchema>;

export type PayloadIssue = { path: string; message: string };

export function parsePayload(input: unknown) {
  const result = testPayloadSchema.safeParse(input);
  if (result.success) return { ok: true as const, payload: result.data };
  const issues: PayloadIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.map(String).join(".") || "(root)",
    message: issue.message,
  }));
  return { ok: false as const, issues };
}

/** Splits a passage into text runs and the question numbers of its blanks. */
export function splitPassage(passage: string) {
  const parts: ({ kind: "text"; text: string } | { kind: "blank"; num: number })[] = [];
  let last = 0;
  for (const match of passage.matchAll(PASSAGE_MARKER)) {
    if (match.index > last) parts.push({ kind: "text", text: passage.slice(last, match.index) });
    parts.push({ kind: "blank", num: Number(match[1]) });
    last = match.index + match[0].length;
  }
  if (last < passage.length) parts.push({ kind: "text", text: passage.slice(last) });
  return parts;
}

type AnyQuestion = FillBlankQuestion | SentenceOrderQuestion | PassageQuestion;

type RawPayload = {
  level: Level;
  grammarPoints: GrammarPoint[];
  sections: [
    { questions: FillBlankQuestion[] },
    { questions: SentenceOrderQuestion[] },
    { passages: { passage: string; questions: PassageQuestion[] }[] },
  ];
};

/** Every question in test order, with its path in the payload. */
function eachQuestion(payload: RawPayload) {
  const [fill, order, passage] = payload.sections;
  return [
    ...fill.questions.map((question, i) => ({ question: question as AnyQuestion, path: ["sections", 0, "questions", i] })),
    ...order.questions.map((question, i) => ({ question: question as AnyQuestion, path: ["sections", 1, "questions", i] })),
    ...passage.passages.flatMap((p, pi) =>
      p.questions.map((question, i) => ({
        question: question as AnyQuestion,
        path: ["sections", 2, "passages", pi, "questions", i],
      })),
    ),
  ];
}

function checkPayload(payload: RawPayload, ctx: z.RefinementCtx) {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: "custom", path, message });

  const known = new Set<string>();
  payload.grammarPoints.forEach((point, i) => {
    const expected = `${payload.level.toLowerCase()}-w${point.week}-d${point.day}-g${point.number}`;
    if (point.id !== expected) issue(["grammarPoints", i, "id"], `Expected "${expected}" for this level, week, day and number.`);
    if (known.has(point.id)) issue(["grammarPoints", i, "id"], `Duplicate grammar point "${point.id}".`);
    known.add(point.id);
  });

  const tested = new Set<string>();
  eachQuestion(payload).forEach(({ question, path }, i) => {
    const num = i + 1;
    if (question.id !== `q${num}`) issue([...path, "id"], `Expected "q${num}" (ids run q1, q2, … in order).`);
    if (!known.has(question.grammarId)) issue([...path, "grammarId"], `"${question.grammarId}" is not in grammarPoints.`);
    tested.add(question.grammarId);

    const options = "pieces" in question ? question.pieces : question.choices;
    if (new Set(options).size !== options.length) issue(path, "The 4 options must all be different.");
    if ("prompt" in question && question.prompt.split(BLANK).length !== 2) {
      issue([...path, "prompt"], `The prompt must contain ${BLANK} exactly once.`);
    }
    if ("correctOrder" in question && [...question.correctOrder].sort().join() !== "0,1,2,3") {
      issue([...path, "correctOrder"], "correctOrder must be a permutation of 0,1,2,3.");
    }
    if ("blank" in question && question.blank !== num) {
      issue([...path, "blank"], `Expected ${num} (the question number).`);
    }
  });

  payload.grammarPoints.forEach((point, i) => {
    if (!tested.has(point.id)) issue(["grammarPoints", i], `"${point.id}" is not tested by any question.`);
  });

  payload.sections[2].passages.forEach((passage, pi) => {
    const markers = splitPassage(passage.passage).flatMap((part) => (part.kind === "blank" ? [part.num] : []));
    const blanks = passage.questions.map((question) => question.blank);
    if (markers.join() !== blanks.join()) {
      issue(
        ["sections", 2, "passages", pi, "passage"],
        `Markers ${markers.map((n) => `[${n}]`).join(" ") || "(none)"} must be exactly ${blanks.map((n) => `[${n}]`).join(" ")}, once each, in order.`,
      );
    }
  });
}
