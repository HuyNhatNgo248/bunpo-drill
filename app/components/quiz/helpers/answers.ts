import type { Answers, QuizQuestion, QuizView } from "~/lib/views";

/** A sentence-order question counts once all 4 slots are filled; the others once a choice is picked. */
export function isAnswered(question: QuizQuestion, answers: Answers) {
  const answer = answers[question.id];
  return question.type === "sentence-order"
    ? Array.isArray(answer) && answer.every((piece) => piece !== null)
    : typeof answer === "number";
}

/** How far the answer sheet is: the answered question ids, their count, what is left, and the percent done. */
export function quizProgress(quiz: QuizView, answers: Answers) {
  const questions = quiz.sections.flatMap((section) => section.groups.flatMap((group) => group.questions));
  const answeredIds = new Set(questions.filter((q) => isAnswered(q, answers)).map((q) => q.id));
  return {
    answeredIds,
    answered: answeredIds.size,
    left: quiz.questionCount - answeredIds.size,
    percent: Math.round((answeredIds.size / quiz.questionCount) * 100),
  };
}
