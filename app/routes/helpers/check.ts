import { msg } from "@lingui/core/macro";
import { data, redirect } from "react-router";
import type { Route } from "./+types/check";
import { requireUserId } from "~/lib/auth.server";
import { testNotFound } from "~/lib/errors";
import { checkSchema, gradeTest } from "~/lib/grading.server";
import { requestLocale, translate } from "~/lib/i18n";
import { getTest } from "~/lib/tests.server";

/**
 * POST /tests/:id/check with {"section", "answers"}: grades one part of a test that is not submitted yet, right
 * answers included. Nothing is saved here: the quiz saves its checked parts with its draft (draft.ts), and the final
 * submit grades the whole test again.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const test = await getTest(params.id, await requireUserId(request));
  if (!test) throw testNotFound();
  // Taken already (a second tab): the results show every part.
  if (test.submission) return redirect(`/tests/${test.id}/results`);
  const body = checkSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return data({ error: translate(requestLocale(request), msg`This part couldn't be checked. Please try again.`) }, { status: 400 });
  }
  const section = gradeTest(test.payload, body.data.answers).sections[body.data.section - 1];
  // A kanji test has 2 parts, not 3.
  if (!section) {
    return data({ error: translate(requestLocale(request), msg`This part couldn't be checked. Please try again.`) }, { status: 400 });
  }
  return { section };
}
