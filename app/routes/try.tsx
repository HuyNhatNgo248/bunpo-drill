import { msg } from "@lingui/core/macro";
import { data, type ShouldRevalidateFunction } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/try";
import { Quiz } from "~/components/quiz";
import { Results } from "~/components/results";
import { testNotFound } from "~/lib/errors";
import { submittedAnswersSchema, toDraftView, toQuizView, toResultsView, toSubmission } from "~/lib/grading.server";
import { requestLocale, translate } from "~/lib/i18n";
import { getTrialTest } from "~/lib/trials.server";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData ? `${loaderData.quiz.title} · 文法ドリル` : "文法ドリル" }];
}

/** A trial test (trials.server.ts), for anyone, signed in or not. */
export async function loader({ params }: Route.LoaderArgs) {
  const test = getTrialTest(params.id);
  if (!test) throw testNotFound();
  return { quiz: toQuizView(test), draft: toDraftView(test) };
}

/** The submit grades the test and answers with its results, in place of the quiz. Nothing is saved: a reload starts it again. */
export async function action({ request, params }: Route.ActionArgs) {
  const test = getTrialTest(params.id);
  if (!test) throw testNotFound();
  const body = z.object({ answers: submittedAnswersSchema }).safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return data({ error: translate(requestLocale(request), msg`Your answers couldn't be read. Please try again.`) }, { status: 400 });
  }
  return { results: toResultsView(test, toSubmission(test.payload, body.data.answers)) };
}

/** The test never changes, so neither a check nor the submit loads it again. */
export const shouldRevalidate: ShouldRevalidateFunction = ({ formMethod, defaultShouldRevalidate }) =>
  formMethod ? false : defaultShouldRevalidate;

export default function TryRoute({ loaderData, actionData }: Route.ComponentProps) {
  if (actionData && "results" in actionData) return <Results results={actionData.results} trial />;
  return <Quiz key={loaderData.quiz.id} quiz={loaderData.quiz} draft={loaderData.draft} error={actionData?.error} trial />;
}
