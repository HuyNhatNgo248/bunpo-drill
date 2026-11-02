import { redirect } from "react-router";
import type { Route } from "./+types/retake";
import { requireUserId } from "~/lib/auth.server";
import { testNotFound } from "~/lib/errors";
import { wrongOnlyDraft } from "~/lib/grading.server";
import { getTest, resetTest, saveDraft } from "~/lib/tests.server";

/**
 * POST /tests/:id/retake: clear the last result and review chips, then open the quiz.
 * With ?only=wrong, the quiz asks only the questions answered wrong; the right answers are kept for the score.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const test = new URL(request.url).searchParams.get("only") === "wrong" ? await getTest(params.id, userId) : null;
  if (!(await resetTest(userId, params.id))) throw testNotFound();
  if (test?.submission) await saveDraft(userId, test.id, wrongOnlyDraft(test.payload, test.submission.answers));
  return redirect(`/tests/${params.id}`);
}

/** A plain visit clears nothing: it goes to the quiz, which shows the results of a test that is taken. */
export function loader({ params }: Route.LoaderArgs) {
  return redirect(`/tests/${params.id}`);
}
