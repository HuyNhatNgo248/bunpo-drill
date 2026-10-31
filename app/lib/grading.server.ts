import { z } from "zod";
import { splitTarget, type KanjiTestPayload } from "./kanji-payload";
import { BLANK, splitPassage, type PassageQuestion, type TestPayload } from "./payload";
import { isKanji, type AnyPayload } from "./test-kinds";
import type { ListedTest, StoredTest, Submission } from "./tests.server";
import type {
  Answer,
  Answers,
  QuizSection,
  QuizView,
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

const numberOf = (id: string) => Number(id.slice(1));
const label = (options: string[], index: number) => `${index + 1} ${options[index]}`;
const choiceOf = (answer: Answer | undefined) => (typeof answer === "number" ? answer : null);

export function questionCount(payload: AnyPayload) {
  if (isKanji(payload)) return payload.sections.reduce((sum, section) => sum + section.questions.length, 0);
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
  const basics = { id: test.id, title: payload.title, level: payload.level, questionCount: questionCount(payload) };
  return isKanji(payload)
    ? { ...basics, kind: "kanji", chapter: payload.chapter, sections: kanjiQuizSections(payload) }
    : { ...basics, kind: "grammar", chapter: null, sections: grammarQuizSections(payload) };
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
        questions: questions.map(({ id, prompt, choices }) => ({ type, id, num: numberOf(id), prompt: splitTarget(prompt), choices })),
      },
    ],
  }));
}

/** Grades the answers: each part's questions, the score, and the grammar points (or, on a kanji test, the words) got wrong. */
export function gradeTest(payload: AnyPayload, answers: Answers) {
  return isKanji(payload) ? gradeKanji(payload, answers) : gradeGrammar(payload, answers);
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
      },
      underlined: null,
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
      explanation: q.explanation ?? null,
    };
  };

  const passageGroups: ResultGroup[] = passage.passages.map((p) => {
    const questions = p.questions.map(gradePassageQuestion);
    return {
      questions,
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
      resultSection(1, "fill-blank", [{ segments: null, questions: fillQuestions }]),
      resultSection(2, "sentence-order", [{ segments: null, questions: orderQuestions }]),
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
            explanation: q.explanation ?? null,
          };
        }),
      },
    ]),
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

export function toSubmission(payload: AnyPayload, submitted: Answers): Submission {
  const ids = new Set(Object.keys(submitted).filter((id) => /^q[1-9][0-9]*$/.test(id) && numberOf(id) <= questionCount(payload)));
  const answers = Object.fromEntries(Object.entries(submitted).filter(([id]) => ids.has(id)));
  const { score, total, wrongGrammarIds } = gradeTest(payload, answers);
  return { submittedAt: new Date().toISOString(), answers, score, total, wrongGrammarIds };
}

export function toResultsView(test: StoredTest, submission: Submission): ResultsView {
  const { payload } = test;
  const { sections, score, total, wrongGrammarIds } = gradeTest(payload, submission.answers);
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
  return isKanji(payload)
    ? { ...basics, kind: "kanji", chapter: payload.chapter, review: [], words: wordChips(payload, wrongGrammarIds) }
    : { ...basics, kind: "grammar", chapter: null, review: reviewChips({ payload, reviewed: test.reviewed }, wrongGrammarIds), words: [] };
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
