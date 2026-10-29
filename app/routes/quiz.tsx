import { msg } from "@lingui/core/macro";
import { data, redirect } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/quiz";
import { Quiz } from "~/components/quiz";
import { testNotFound } from "~/lib/errors";
import { submittedAnswersSchema, toQuizView, toSubmission } from "~/lib/grading.server";
import { getTest, saveSubmission } from "~/lib/tests.server";
import { requestLocale, translate } from "~/lib/i18n";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData ? `${loaderData.quiz.title} · 文法ドリル` : "文法ドリル" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const test = await getTest(params.id);
  if (!test) throw testNotFound();
  if (test.submission) throw redirect(`/tests/${test.id}/results`);
  return { quiz: toQuizView(test) };
}

export async function action({ request, params }: Route.ActionArgs) {
  const test = await getTest(params.id);
  if (!test) throw testNotFound();
  // Taken already (a second tab, a double click): only a retake clears a result.
  if (test.submission) return redirect(`/tests/${test.id}/results`);
  const body = z.object({ answers: submittedAnswersSchema }).safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return data({ error: translate(requestLocale(request), msg`Your answers couldn't be read. Please try again.`) }, { status: 400 });
  }
  await saveSubmission(test.id, toSubmission(test.payload, body.data.answers));
  return redirect(`/tests/${test.id}/results`);
}

export default function QuizRoute({ loaderData, actionData }: Route.ComponentProps) {
  // A new test id starts with a clean answer sheet.
  return <Quiz key={loaderData.quiz.id} quiz={loaderData.quiz} error={actionData?.error} />;
}
