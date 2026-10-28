import { msg } from "@lingui/core/macro";
import { redirect } from "react-router";
import type { Route } from "./+types/results";
import { Results } from "~/components/results";
import { testNotFound } from "~/lib/errors";
import { toResultsView } from "~/lib/grading.server";
import { getTest } from "~/lib/tests.server";
import { localeFromMatches, translate } from "~/lib/i18n";

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const results = translate(localeFromMatches(matches), msg`Results`);
  return [{ title: loaderData ? `${results} · ${loaderData.results.title} · 文法ドリル` : "文法ドリル" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const test = await getTest(params.id);
  if (!test) throw testNotFound();
  if (!test.submission) throw redirect(`/tests/${test.id}`);
  return { results: toResultsView(test, test.submission) };
}

export default function ResultsRoute({ loaderData }: Route.ComponentProps) {
  return <Results results={loaderData.results} />;
}
