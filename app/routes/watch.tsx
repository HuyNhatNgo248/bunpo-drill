import { useState } from "react";
import type { Route } from "./+types/watch";
import { testNotFound } from "~/lib/errors";
import { toQuizView } from "~/lib/grading.server";
import { useLiveSocket } from "~/lib/live";
import { getTest } from "~/lib/tests.server";
import type { Answers } from "~/lib/views";
import { Quiz } from "./quiz";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData ? `ライブ · ${loaderData.quiz.title} · 文法ドリル` : "文法ドリル" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const test = await getTest(params.id);
  if (!test) throw testNotFound();
  return { quiz: toQuizView(test) };
}

/** GET /tests/:id/watch: the quiz as it is being answered on another device, read-only. */
export default function Watch({ loaderData }: Route.ComponentProps) {
  const [answers, setAnswers] = useState<Answers>({});
  useLiveSocket(loaderData.quiz.id, setAnswers);
  return <Quiz quiz={loaderData.quiz} live={answers} />;
}
