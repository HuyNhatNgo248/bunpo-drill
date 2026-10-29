import { redirect } from "react-router";
import type { Route } from "./+types/retake";
import { testNotFound } from "~/lib/errors";
import { resetTest } from "~/lib/tests.server";

/** POST /tests/:id/retake: clear the last result and review chips, then open the quiz. */
export async function action({ params }: Route.ActionArgs) {
  const test = await resetTest(params.id);
  if (!test) throw testNotFound();
  return redirect(`/tests/${test.id}`);
}

/** A plain visit clears nothing: it goes to the quiz, which shows the results of a test that is taken. */
export function loader({ params }: Route.LoaderArgs) {
  return redirect(`/tests/${params.id}`);
}
