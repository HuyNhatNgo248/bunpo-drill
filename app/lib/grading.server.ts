import { z } from "zod";
import { splitTarget, type KanjiTestPayload } from "./kanji-payload";
import { BLANK, splitPassage, type PassageQuestion, type TestPayload } from "./payload";
import {
  passagesOf,
  plainText,
  readingGroupOf,
  TARGET_SECONDS,
  underlineRuns,
  type ReadingPassage,
  type ReadingTestPayload,
  type ReadingType,
} from "./reading-payload";
import { isKanji, isReading, type AnyPayload } from "./test-kinds";
import type { Draft, ListedTest, StoredTest, Submission } from "./tests.server";
import type {
  Answer,
  Answers,
  QuizDraft,
  QuizGroup,
  QuizSection,
  QuizSegment,
  QuizView,
  ReadingPassageView,
  ReadingRun,
  ResultGroup,
  ResultQuestion,
  ResultSection,
  ResultsView,
  ReviewChip,
  TestSummary,
  WordChip,
} from "./views";

const choiceIndex = z.number().int().min(0).max(3);

/** What the quiz page submits: questionId → choice index, or the 4 slots of a sentence-order question. */
export const submittedAnswersSchema = z.record(
  z.string(),
  z.union([choiceIndex, z.array(choiceIndex.nullable()).length(4), z.null()]),
);

/** What the quiz saves while it is taken: its answers and the numbers of its checked parts. */
export const draftSchema = z.object({
  answers: submittedAnswersSchema,
  checked: z.array(z.number().int().min(1).max(5)).max(5),
  kept: z.array(z.string()).max(200).optional(),
  times: z.array(z.number().int().min(0)).max(30).optional(),
});

/** What the quiz sends to check one part: the part's number and the answers. */
export const checkSchema = z.object({ section: z.number().int().min(1).max(5), answers: submittedAnswersSchema });

/** The longest a passage is timed, in seconds: a set left open overnight doesn't count its night. */
const MAX_SECONDS = 3 * 60 * 60;

const numberOf = (id: string) => Number(id.slice(1));
const label = (options: string[], index: number) => `${index + 1} ${options[index]}`;
const choiceOf = (answer: Answer | undefined) => (typeof answer === "number" ? answer : null);

export function questionCount(payload: AnyPayload) {
  if (isKanji(payload)) return payload.sections.reduce((sum, section) => sum + section.questions.length, 0);
  if (isReading(payload)) return passagesOf(payload).reduce((sum, { passage }) => sum + passage.questions.length, 0);
  const [fill, order, passage] = payload.sections;
  return (
    fill.questions.length +
    order.questions.length +
    passage.passages.reduce((sum, p) => sum + p.questions.length, 0)
  );
}

/** The quiz as the browser sees it: no answers, no grammar ids and no word ids. */
export function toQuizView(test: StoredTest): QuizView {
  const { payload } = test;
  const all = isKanji(payload) ? kanjiQuizSections(payload) : isReading(payload) ? readingQuizSections(payload) : grammarQuizSections(payload);
  const sections = withoutKeptQuestions(all, test.draft);
  const count = sections.reduce((sum, s) => sum + s.groups.reduce((n, g) => n + g.questions.length, 0), 0);
  const basics = { id: test.id, title: payload.title, level: payload.level, questionCount: count, sections };
  if (isKanji(payload)) return { ...basics, kind: "kanji", chapter: payload.chapter };
  return isReading(payload) ? { ...basics, kind: "reading", chapter: readingGroupOf(payload) } : { ...basics, kind: "grammar", chapter: null };
}

/** Leaves out the questions a retake of the wrong answers keeps. A kept passage blank shows its right answer as text. */
function withoutKeptQuestions(sections: QuizSection[], draft: Draft | null): QuizSection[] {
  const kept = new Set(draft?.kept);
  if (!kept.size) return sections;
  const fill = (group: QuizGroup) =>
    group.segments?.map((part): QuizSegment => {
      if (part.kind === "text" || !kept.has(part.questionId)) return part;
      const question = group.questions.find((q) => q.id === part.questionId);
      const picked = choiceOf(draft?.answers[part.questionId]);
      return question?.type === "passage" && picked !== null ? { kind: "text", text: question.choices[picked] } : part;
    }) ?? null;
  return sections
    .map((section) => ({ ...section, groups: dropKept(section.groups.map((group) => ({ ...group, segments: fill(group) })), kept) }))
    .filter((section) => section.groups.length);
}

/** The groups without the `kept` questions, and without groups left empty. */
function dropKept<G extends { questions: { id: string }[] }>(groups: G[], kept: Set<string>): G[] {
  return groups.map((group) => ({ ...group, questions: group.questions.filter((q) => !kept.has(q.id)) })).filter((group) => group.questions.length);
}

/** A checked part of a retake of the wrong answers: only the questions it asked. */
export function withoutKept(section: ResultSection, kept: string[] = []): ResultSection {
  return kept.length ? resultSection(section.no, section.type, dropKept(section.groups, new Set(kept))) : section;
}

/** The draft that retakes only the wrong answers of `answers`: the right ones are kept, answered and hidden. */
export function wrongOnlyDraft(payload: AnyPayload, answers: Answers): Draft {
  const right = gradeTest(payload, answers).sections.flatMap((s) => s.groups.flatMap((g) => g.questions)).filter((q) => q.correct).map((q) => q.id);
  return { answers: Object.fromEntries(right.map((id) => [id, answers[id]])), checked: [], kept: right };
}

function grammarQuizSections(payload: TestPayload): QuizSection[] {
  const [fill, order, passage] = payload.sections;
  return [
    {
      no: 1,
      type: "fill-blank",
      groups: [
        {
          segments: null,
          reading: null,
          questions: fill.questions.map(({ id, prompt, choices }) => ({
            type: "fill-blank",
            id,
            num: numberOf(id),
            prompt,
            choices,
          })),
        },
      ],
    },
    {
      no: 2,
      type: "sentence-order",
      groups: [
        {
          segments: null,
          reading: null,
          questions: order.questions.map(({ id, before, after, starSlot, pieces }) => ({
            type: "sentence-order",
            id,
            num: numberOf(id),
            before,
            after,
            starSlot,
            pieces,
          })),
        },
      ],
    },
    {
      no: 3,
      type: "passage",
      groups: passage.passages.map((p) => ({
        segments: splitPassage(p.passage).map((part) =>
          part.kind === "text" ? part : { kind: "blank", num: part.num, questionId: `q${part.num}` },
        ),
        reading: null,
        questions: p.questions.map(({ id, choices }) => ({ type: "passage", id, num: numberOf(id), choices })),
      })),
    },
  ];
}

function kanjiQuizSections(payload: KanjiTestPayload): QuizSection[] {
  return payload.sections.map(({ type, questions }, i) => ({
    no: i + 1,
    type,
    groups: [
      {
        segments: null,
        reading: null,
        questions: questions.map(({ id, prompt, choices }) => ({ type, id, num: numberOf(id), prompt: splitTarget(prompt), choices })),
      },
    ],
  }));
}

/** A reading set's 問題, a group per passage. The quiz is sent no evidence, so no run is marked as one. */
function readingQuizSections(payload: ReadingTestPayload): QuizSection[] {
  let index = 0;
  return payload.sections.map(({ type, passages }, i) => ({
    no: i + 1,
    type,
    groups: passages.map((passage, p) => ({
      segments: null,
      reading: passageView(passage, type, { index: index++, num: p + 1 }),
      questions: passage.questions.map(({ id, prompt, choices }) => ({ type, id, num: numberOf(id), prompt: runsOf(prompt), choices, passage: p + 1 })),
    })),
  }));
}

/** A passage as its card shows it; on the results, with its `evidence` marked, its tip and its time. */
function passageView(
  passage: ReadingPassage,
  type: ReadingType,
  { index, num, evidence = [], seconds = null, results = false }: { index: number; num: number; evidence?: string[]; seconds?: number | null; results?: boolean },
): ReadingPassageView {
  return {
    index,
    num,
    lead: passage.lead ?? null,
    blocks: passage.blocks.map((block) =>
      block.kind === "text"
        ? { kind: "text", label: block.label ?? null, paragraphs: paragraphsOf(runsOf(block.text, evidence)) }
        : { kind: "table", head: block.head, rows: block.rows.map((row) => row.map((cell) => runsOf(cell, evidence))) },
    ),
    notes: passage.notes,
    targetSeconds: TARGET_SECONDS[type],
    tip: results ? (passage.tip ?? null) : null,
    seconds,
  };
}

/**
 * A text marked with <u>…</u> as runs, the parts that are one of `evidence` marked too.
 *
 * @example
 * runsOf("<u>私は</u>歩く。", ["歩く。"]); // -> [{ text: "私は", underline: true, evidence: false }, { text: "歩く。", underline: false, evidence: true }]
 */
export function runsOf(text: string, evidence: string[] = []): ReadingRun[] {
  const plain = plainText(text);
  const underline = underlineRuns(text).flatMap((run) => [...run.text].map(() => run.underline));
  const chars = [...plain];
  // Evidence is found in the plain text by its index, so a run of chars, not of code units, is marked.
  const marked = chars.map(() => false);
  for (const part of evidence) {
    const at = plain.indexOf(part);
    if (at < 0) continue;
    const start = [...plain.slice(0, at)].length;
    for (let i = start; i < start + [...part].length; i++) marked[i] = true;
  }
  const runs: ReadingRun[] = [];
  chars.forEach((char, i) => {
    const last = runs.at(-1);
    if (last && last.underline === underline[i] && last.evidence === marked[i]) last.text += char;
    else runs.push({ text: char, underline: underline[i]!, evidence: marked[i]! });
  });
  return runs;
}

/** Runs split into paragraphs at each line break. */
function paragraphsOf(runs: ReadingRun[]): ReadingRun[][] {
  const paragraphs: ReadingRun[][] = [[]];
  for (const run of runs) {
    run.text.split("\n").forEach((text, i) => {
      if (i > 0) paragraphs.push([]);
      if (text) paragraphs.at(-1)!.push({ ...run, text });
    });
  }
  return paragraphs.filter((paragraph) => paragraph.length);
}

/** Where the quiz was left: the draft's answers, and its checked parts graded again from them. */
export function toDraftView(test: StoredTest): QuizDraft {
  const times = test.draft?.times;
  const answers = test.draft?.answers ?? {};
  const checked = test.draft?.checked ?? [];
  const kept = test.draft?.kept ?? [];
  const { sections } = gradeTest(test.payload, answers);
  const checks = Object.fromEntries(sections.filter((section) => checked.includes(section.no)).map((section) => [section.no, withoutKept(section, kept)]));
  return { answers, checks, kept, ...(times && { times }) };
}

/**
 * Grades the answers: each part's questions, the score, and what was got wrong: the grammar points, the words of a
 * kanji test, or the questions of a reading set. A reading set's passages show the `times` they took.
 */
export function gradeTest(payload: AnyPayload, answers: Answers, times?: number[]) {
  if (isKanji(payload)) return gradeKanji(payload, answers);
  return isReading(payload) ? gradeReading(payload, answers, times) : gradeGrammar(payload, answers);
}

function gradeGrammar(payload: TestPayload, answers: Answers) {
  const [fill, order, passage] = payload.sections;
  const wrong: string[] = [];
  const track = (question: { grammarId: string }, correct: boolean) => {
    if (!correct && !wrong.includes(question.grammarId)) wrong.push(question.grammarId);
    return correct;
  };

  const fillQuestions: ResultQuestion[] = fill.questions.map((q) => {
    const picked = choiceOf(answers[q.id]);
    const [before, after] = q.prompt.split(BLANK);
    return {
      id: q.id,
      num: numberOf(q.id),
      type: "fill-blank",
      correct: track(q, picked === q.answerIndex),
      yours: picked === null ? null : label(q.choices, picked),
      answer: label(q.choices, q.answerIndex),
      prompt: { before, after, fill: q.choices[q.answerIndex] },
      sentence: null,
      underlined: null,
      reading: null,
      explanation: q.explanation ?? null,
    };
  });

  const orderQuestions: ResultQuestion[] = order.questions.map((q) => {
    const star = q.starSlot - 1;
    const slots = answers[q.id];
    const placed = Array.isArray(slots) ? (slots[star] ?? null) : null;
    const expected = q.correctOrder[star];
    return {
      id: q.id,
      num: numberOf(q.id),
      type: "sentence-order",
      correct: track(q, placed === expected),
      yours: placed === null ? null : label(q.pieces, placed),
      answer: label(q.pieces, expected),
      prompt: null,
      sentence: {
        before: q.before,
        after: q.after,
        pieces: q.correctOrder.map((piece, slot) => ({ text: q.pieces[piece], star: slot === star })),
        // An empty slot shows as a blank piece.
        yours: placed === null ? null : (slots as (number | null)[]).map((piece, slot) => ({ text: piece === null ? "　" : q.pieces[piece], star: slot === star })),
      },
      underlined: null,
      reading: null,
      explanation: q.explanation ?? null,
    };
  });

  const gradePassageQuestion = (q: PassageQuestion): ResultQuestion => {
    const picked = choiceOf(answers[q.id]);
    return {
      id: q.id,
      num: numberOf(q.id),
      type: "passage",
      correct: track(q, picked === q.answerIndex),
      yours: picked === null ? null : label(q.choices, picked),
      answer: label(q.choices, q.answerIndex),
      prompt: null,
      sentence: null,
      underlined: null,
      reading: null,
      explanation: q.explanation ?? null,
    };
  };

  const passageGroups: ResultGroup[] = passage.passages.map((p) => {
    const questions = p.questions.map(gradePassageQuestion);
    return {
      questions,
      reading: null,
      segments: splitPassage(p.passage).map((part) => {
        if (part.kind === "text") return part;
        const question = p.questions.find((q) => q.blank === part.num)!;
        const result = questions.find((q) => q.num === part.num)!;
        return { kind: "blank" as const, num: part.num, fill: question.choices[question.answerIndex], correct: result.correct };
      }),
    };
  });

  return graded(
    [
      resultSection(1, "fill-blank", [{ segments: null, reading: null, questions: fillQuestions }]),
      resultSection(2, "sentence-order", [{ segments: null, reading: null, questions: orderQuestions }]),
      resultSection(3, "passage", passageGroups),
    ],
    wrong,
  );
}

function gradeKanji(payload: KanjiTestPayload, answers: Answers) {
  const wrong: string[] = [];
  const sections = payload.sections.map(({ type, questions }, i) =>
    resultSection(i + 1, type, [
      {
        segments: null,
        reading: null,
        questions: questions.map((q): ResultQuestion => {
          const picked = choiceOf(answers[q.id]);
          const correct = picked === q.answerIndex;
          if (!correct && !wrong.includes(q.wordId)) wrong.push(q.wordId);
          return {
            id: q.id,
            num: numberOf(q.id),
            type,
            correct,
            yours: picked === null ? null : label(q.choices, picked),
            answer: label(q.choices, q.answerIndex),
            prompt: null,
            sentence: null,
            underlined: splitTarget(q.prompt),
            reading: null,
            explanation: q.explanation ?? null,
          };
        }),
      },
    ]),
  );
  return graded(sections, wrong);
}

function gradeReading(payload: ReadingTestPayload, answers: Answers, times: number[] = []) {
  const wrong: string[] = [];
  let index = 0;
  const sections = payload.sections.map(({ type, passages }, i) =>
    resultSection(
      i + 1,
      type,
      passages.map((passage, p) => {
        const at = index++;
        return {
          segments: null,
          reading: passageView(passage, type, {
            index: at,
            num: p + 1,
            evidence: passage.questions.map((q) => q.evidence),
            seconds: times[at] ?? null,
            results: true,
          }),
          questions: passage.questions.map((q): ResultQuestion => {
            const picked = choiceOf(answers[q.id]);
            const correct = picked === q.answerIndex;
            if (!correct) wrong.push(q.id);
            return {
              id: q.id,
              num: numberOf(q.id),
              type,
              correct,
              yours: picked === null ? null : label(q.choices, picked),
              answer: label(q.choices, q.answerIndex),
              prompt: null,
              sentence: null,
              underlined: null,
              reading: { prompt: runsOf(q.prompt), kind: q.kind, trap: picked === null ? null : (q.traps[picked] ?? null) },
              explanation: q.explanation,
            };
          }),
        };
      }),
    ),
  );
  return graded(sections, wrong);
}

function resultSection(no: number, type: ResultSection["type"], groups: ResultGroup[]): ResultSection {
  const questions = groups.flatMap((group) => group.questions);
  return { no, type, correct: questions.filter((q) => q.correct).length, total: questions.length, groups };
}

function graded(sections: ResultSection[], wrong: string[]) {
  const score = sections.reduce((sum, s) => sum + s.correct, 0);
  const total = sections.reduce((sum, s) => sum + s.total, 0);
  return { sections, score, total, wrongGrammarIds: wrong };
}

export function toSubmission(payload: AnyPayload, submitted: Answers, times: number[] = []): Submission {
  const ids = new Set(Object.keys(submitted).filter((id) => /^q[1-9][0-9]*$/.test(id) && numberOf(id) <= questionCount(payload)));
  const answers = Object.fromEntries(Object.entries(submitted).filter(([id]) => ids.has(id)));
  const { score, total, wrongGrammarIds } = gradeTest(payload, answers);
  const submission = { submittedAt: new Date().toISOString(), answers, score, total, wrongGrammarIds };
  if (!isReading(payload)) return submission;
  // One time per passage, each a whole number of seconds within the cap.
  const passages = passagesOf(payload).length;
  return { ...submission, times: Array.from({ length: passages }, (_, i) => Math.min(Math.max(Math.round(times[i] ?? 0), 0), MAX_SECONDS)) };
}

export function toResultsView(test: StoredTest, submission: Submission): ResultsView {
  const { payload } = test;
  const { sections, score, total, wrongGrammarIds } = gradeTest(payload, submission.answers, submission.times);
  const basics = {
    id: test.id,
    title: payload.title,
    level: payload.level,
    score,
    total,
    percent: percentOf(score, total),
    sections,
    previous: previousAttempt(test, submission),
  };
  if (isKanji(payload)) return { ...basics, kind: "kanji", chapter: payload.chapter, review: [], words: wordChips(payload, wrongGrammarIds) };
  if (isReading(payload)) return { ...basics, kind: "reading", chapter: readingGroupOf(payload), review: [], words: [] };
  return { ...basics, kind: "grammar", chapter: null, review: reviewChips({ payload, reviewed: test.reviewed }, wrongGrammarIds), words: [] };
}

export function toSummary(test: ListedTest): TestSummary {
  const { payload, submission } = test;
  return {
    id: test.id,
    title: payload.title,
    level: payload.level,
    questionCount: test.questionCount,
    result: submission
      ? { score: submission.score, total: submission.total, percent: percentOf(submission.score, submission.total) }
      : null,
    review: submission ? reviewChips(test, submission.wrongGrammarIds) : [],
    previous: previousAttempt(test, submission),
    answered: test.answered,
    weeks: [...new Set(payload.grammarPoints.map((point) => point.week))].sort((a, b) => a - b),
    patterns: [...new Set(payload.grammarPoints.map((point) => point.pattern))],
  };
}

/** The last attempt from before `submission`, or the last of all when there is none (a retake under way). */
function previousAttempt({ attempts }: Pick<StoredTest, "attempts">, submission: Pick<Submission, "submittedAt"> | null) {
  const before = attempts.filter((attempt) => !submission || attempt.submittedAt < submission.submittedAt).at(-1);
  return before ? { score: before.score, total: before.total } : null;
}

function reviewChips(test: Pick<ListedTest, "payload" | "reviewed">, grammarIds: string[]): ReviewChip[] {
  return grammarIds.flatMap((grammarId) => {
    const point = test.payload.grammarPoints.find((p) => p.id === grammarId);
    if (!point) return [];
    const { pattern, week, day, number } = point;
    return [{ grammarId, pattern, level: test.payload.level, week, day, number, reviewed: !!test.reviewed[grammarId] }];
  });
}

function wordChips(payload: KanjiTestPayload, wordIds: string[]): WordChip[] {
  return wordIds.flatMap((wordId) => {
    const word = payload.words.find((w) => w.id === wordId);
    return word ? [{ wordId, word: word.word, reading: word.reading }] : [];
  });
}

const percentOf = (score: number, total: number) => (total === 0 ? 0 : Math.round((score / total) * 100));
