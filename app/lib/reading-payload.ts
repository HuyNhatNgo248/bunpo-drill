import { z } from "zod";
import { answerIndex, choices, JLPT_LEVELS, questionId, READING_TYPES, type JlptLevel } from "./payload";

export { READING_TYPES };

/**
 * The reading format, version 1, which Claude POSTs with the jlpt-reading-quiz skill: a set of passages in the reading
 * 問題 of a JLPT level (短文, 中文, 長文, 統合理解, 主張理解, 情報検索), each question with the sentence that proves its
 * answer and the trap of every wrong choice, so the results can show both.
 *
 * Like kanji-payload.ts, this file is the single source of truth: the API checks every POST with this schema, and
 * `pnpm schema` writes the skill's test.schema.json from it.
 */
export const READING_VERSION = 1;

export type ReadingType = (typeof READING_TYPES)[number];

/** How long a passage of each type should take, in seconds, so a whole reading section fits the exam's time. */
export const TARGET_SECONDS: Record<ReadingType, number> = {
  "reading-short": 120,
  "reading-mid": 360,
  "reading-long": 600,
  "reading-integrated": 360,
  "reading-claim": 600,
  "reading-info": 360,
};

/** The reading 問題 each level's exam has, in its order. */
export const LEVEL_TYPES: Record<JlptLevel, readonly ReadingType[]> = {
  N5: ["reading-short", "reading-mid", "reading-info"],
  N4: ["reading-short", "reading-mid", "reading-info"],
  N3: ["reading-short", "reading-mid", "reading-long", "reading-info"],
  N2: ["reading-short", "reading-mid", "reading-integrated", "reading-claim", "reading-info"],
  N1: ["reading-short", "reading-mid", "reading-long", "reading-integrated", "reading-claim", "reading-info"],
};

/** What a question asks for. */
export const QUESTION_KINDS = ["理由", "指示語", "主張", "詳細", "比較", "条件"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

/** How a wrong choice is built, as the official sample's wrong choices are. */
export const TRAPS = ["changed-detail", "opposite", "not-in-text", "true-not-answer", "over-general", "missed-condition"] as const;
export type Trap = (typeof TRAPS)[number];

/** An underlined part of a text or a prompt: <u>…</u>. */
const UNDERLINE = /<u>([\s\S]*?)<\/u>/g;

/** A text without its <u> tags: what the reader sees, and what an `evidence` sentence is found in. */
export const plainText = (text: string) => text.replace(/<\/?u>/g, "");

/**
 * A text split into runs, each underlined or not.
 *
 * @example
 * underlineRuns("しかし、<u>私は歩く</u>。"); // -> [{ text: "しかし、", underline: false }, { text: "私は歩く", underline: true }, { text: "。", underline: false }]
 */
export function underlineRuns(text: string): { text: string; underline: boolean }[] {
  const runs: { text: string; underline: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(UNDERLINE)) {
    if (match.index > last) runs.push({ text: text.slice(last, match.index), underline: false });
    runs.push({ text: match[1]!, underline: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), underline: false });
  return runs;
}

/** True when every <u> is closed and none is nested or empty. */
const wellUnderlined = (text: string) =>
  !/<\/?u>/.test(text.replace(UNDERLINE, (_, inner: string) => (inner && !inner.includes("<u>") ? "" : "<u>")));

const marked = z
  .string()
  .min(1)
  .max(2000)
  .describe("Plain text; mark an underlined part <u>…</u>, as the exam underlines it (①② go inside: <u>①そうなると</u>). Paragraphs are separated by \\n.");

const textBlock = z.strictObject({
  kind: z.literal("text"),
  label: z.string().min(1).max(4).optional().describe('"A" or "B" for the two texts of 統合理解; none otherwise.'),
  text: marked,
});

const cell = z.string().max(200);
const tableBlock = z.strictObject({
  kind: z.literal("table"),
  head: z.array(cell.min(1)).min(1).max(8).describe("The column headings."),
  rows: z.array(z.array(cell).min(1).max(8)).min(1).max(20).describe("Each row has one cell per heading."),
});

const block = z.discriminatedUnion("kind", [textBlock, tableBlock]);

const readingQuestionSchema = z.strictObject({
  id: questionId,
  prompt: z
    .string()
    .min(1)
    .max(300)
    .describe("The question, in the exam's words. Copy the underlined part it asks about inside <u>…</u>: \"<u>あえてアプリを閉じて歩く</u>とあるが、なぜか。\"."),
  choices,
  answerIndex,
  kind: z.enum(QUESTION_KINDS).describe("What the question asks for: 理由 (why), 指示語 (what a word points to), 主張 (the writer's view), 詳細 (a detail), 比較 (A and B compared), 条件 (conditions)."),
  traps: z
    .array(z.enum(TRAPS).nullable())
    .length(4)
    .describe("The trap of each choice, in choice order: null for the right one, and for each wrong one how it is built."),
  evidence: z
    .string()
    .min(2)
    .max(300)
    .describe("The sentence (or table cell) that decides the answer, copied exactly from the passage without <u> tags. The results highlight it."),
  explanation: z
    .string()
    .min(1)
    .max(500)
    .describe("In English, one to three sentences: why the answer is right, pointing at the evidence, and which trap each other choice sets."),
});

const passageSchema = z.strictObject({
  lead: z
    .string()
    .min(1)
    .max(120)
    .optional()
    .describe("The exam's line above a practical text: \"以下は、ある会社が取引先に送ったメールの内容である。\"."),
  blocks: z
    .array(block)
    .min(1)
    .max(6)
    .describe("The passage: one text block; 2 for 統合理解 (A and B); for 情報検索 a table, and text blocks for its notes and ※ footnotes."),
  notes: z
    .array(
      z.strictObject({
        word: z.string().min(1).max(20).describe("A word above N2 as the passage writes it: \"醍醐味\"."),
        gloss: z.string().min(1).max(60).describe("Its meaning in easy Japanese: \"本当のおもしろさ\"."),
      }),
    )
    .max(6)
    .describe("The （注） under the passage, in the order the words appear."),
  tip: z
    .string()
    .min(1)
    .max(300)
    .optional()
    .describe("One line in English on how to read this passage faster: where its answers are. The results show it when the passage took too long."),
  questions: z.array(readingQuestionSchema).min(1).max(4),
});

const sectionSchema = z.strictObject({
  type: z.enum(READING_TYPES),
  passages: z.array(passageSchema).min(1).max(5),
});

const readingObject = z.strictObject({
  version: z.literal(READING_VERSION),
  kind: z.literal("reading"),
  title: z.string().min(1).max(60).describe('The set\'s name: "短文 4", "中文 2", "総合 1".'),
  level: z.enum(JLPT_LEVELS),
  sections: z
    .array(sectionSchema)
    .min(1)
    .max(6)
    .describe("One section per reading type, each type at most once, in the exam's order (短文, 中文, 長文, 統合理解, 主張理解, 情報検索), and only the types the level's exam has."),
});

export const readingTestPayloadSchema = readingObject.superRefine(checkReading).meta({
  title: "Reading test payload",
  description: [
    "Body of POST /api/tests for a reading set, version 1.",
    "Rules the server also enforces:",
    "1. Sections are of different types, in the exam's order, and only the level's: N5/N4 短文 中文 情報検索; N3 adds 長文; N2 短文 中文 統合理解 主張理解 情報検索; N1 all six.",
    '2. Question ids run "q1", "q2", … in order with no gaps; the 4 choices are all different.',
    "3. traps is null at answerIndex and a trap at every other choice.",
    "4. evidence appears exactly once in the passage's texts and table cells (without <u> tags).",
    "5. Every <u> is closed, not nested and not empty; every （注） word appears in the passage.",
    "6. 統合理解 has two text blocks labelled A and B; 情報検索 has a table.",
    "A set usually has 5 passages of one type. Targets per passage: 短文 2 min, 中文 6, 長文 10, 統合理解 6, 主張理解 10, 情報検索 6.",
  ].join("\n"),
});

export type ReadingTestPayload = z.infer<typeof readingTestPayloadSchema>;
export type ReadingSection = z.infer<typeof sectionSchema>;
export type ReadingPassage = z.infer<typeof passageSchema>;
export type ReadingQuestion = z.infer<typeof readingQuestionSchema>;
export type ReadingBlock = z.infer<typeof block>;

/** The texts a passage's evidence can be found in: its text blocks without tags, and its table cells. */
export const passageTexts = (passage: Pick<ReadingPassage, "blocks">) =>
  passage.blocks.flatMap((b) => (b.kind === "text" ? [plainText(b.text)] : b.rows.flat()));

/** How often `part` appears in `text`. */
const count = (text: string, part: string) => text.split(part).length - 1;

type RawReading = z.infer<typeof readingObject>;

function checkReading(payload: RawReading, ctx: z.RefinementCtx) {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
  const order = payload.sections.map((section) => READING_TYPES.indexOf(section.type));
  if (order.some((at, i) => i > 0 && at <= order[i - 1]!)) issue(["sections"], "One section per type, in the exam's order: 短文, 中文, 長文, 統合理解, 主張理解, 情報検索.");
  payload.sections.forEach((section, s) => {
    if (!LEVEL_TYPES[payload.level].includes(section.type)) issue(["sections", s, "type"], `${payload.level}'s exam has no ${section.type}.`);
  });

  let num = 0;
  payload.sections.forEach((section, s) =>
    section.passages.forEach((passage, p) => {
      const at = ["sections", s, "passages", p];
      const texts = passage.blocks.flatMap((b, i) => (b.kind === "text" ? [{ text: b.text, label: b.label, i }] : []));
      texts.forEach(({ text, i }) => wellUnderlined(text) || issue([...at, "blocks", i, "text"], "Every <u> must be closed, not nested and not empty."));
      passage.blocks.forEach((b, i) => {
        if (b.kind === "table" && b.rows.some((row) => row.length !== b.head.length)) issue([...at, "blocks", i, "rows"], "Every row needs one cell per heading.");
      });
      if (section.type === "reading-integrated" && texts.map((t) => t.label).join() !== "A,B") {
        issue([...at, "blocks"], "統合理解 has two text blocks, labelled A and B.");
      }
      if (section.type === "reading-info" && !passage.blocks.some((b) => b.kind === "table")) issue([...at, "blocks"], "情報検索 needs a table.");

      const all = passageTexts(passage);
      passage.notes.forEach(({ word }, n) => {
        if (!all.some((text) => text.includes(word))) issue([...at, "notes", n, "word"], `"${word}" is not in the passage.`);
      });

      passage.questions.forEach((question, q) => {
        num += 1;
        const path = [...at, "questions", q];
        if (question.id !== `q${num}`) issue([...path, "id"], `Expected "q${num}" (ids run q1, q2, … in order).`);
        if (new Set(question.choices).size !== 4) issue([...path, "choices"], "The 4 choices must all be different.");
        if (!wellUnderlined(question.prompt)) issue([...path, "prompt"], "Every <u> must be closed, not nested and not empty.");
        question.traps.forEach((trap, c) => {
          if (c === question.answerIndex ? trap !== null : trap === null) {
            issue([...path, "traps", c], c === question.answerIndex ? "The right choice has no trap: null." : "Name the trap of every wrong choice.");
          }
        });
        const found = all.reduce((sum, text) => sum + count(text, question.evidence), 0);
        if (found !== 1) {
          issue([...path, "evidence"], found ? "The evidence appears more than once: copy a longer part." : "The evidence must be copied exactly from the passage, without <u> tags.");
        }
      });
    }),
  );
}

/** The group of the reading page a set is listed under: its type's number (1 短文 … 6 情報検索), or 7 for 総合. */
export const readingGroupOf = (payload: Pick<ReadingTestPayload, "sections">): number =>
  payload.sections.length === 1 ? READING_TYPES.indexOf(payload.sections[0]!.type) + 1 : READING_TYPES.length + 1;

/** Every passage of a set in order, with its section's type and its number within the section. */
export const passagesOf = (payload: Pick<ReadingTestPayload, "sections">) =>
  payload.sections.flatMap((section) => section.passages.map((passage, i) => ({ passage, type: section.type, num: i + 1 })));
