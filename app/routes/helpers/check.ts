import { msg } from "@lingui/core/macro";
import { data, redirect } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/check";
import { testNotFound } from "~/lib/errors";
import { gradeTest, submittedAnswersSchema } from "~/lib/grading.server";
import { requestLocale, translate } from "~/lib/i18n";
import { getTest } from "~/lib/tests.server";

const checkSchema = z.object({ section: z.number().int().min(1).max(3), answers: submittedAnswersSchema });

/**
 * POST /tests/:id/check with {"section", "answers"}: grades one part of a test that is not submitted yet, right
 * answers included. Nothing is saved: the quiz keeps its checked parts in the browser, and the final submit
 * grades the whole test again.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const test = await getTest(params.id);
  if (!test) throw testNotFound();
  // Taken already (a second tab): the results show every part.
  if (test.submission) return redirect(`/tests/${test.id}/results`);
  const body = checkSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return data({ error: translate(requestLocale(request), msg`This part couldn't be checked. Please try again.`) }, { status: 400 });
  }
  return { section: gradeTest(test.payload, body.data.answers).sections[body.data.section - 1] };
}
