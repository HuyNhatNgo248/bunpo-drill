import { msg } from "@lingui/core/macro";
import { data } from "react-router";
import type { Route } from "./+types/try-check";
import { testNotFound } from "~/lib/errors";
import { checkSchema, gradeTest } from "~/lib/grading.server";
import { requestLocale, translate } from "~/lib/i18n";
import { getTrialTest } from "~/lib/trials.server";

/** POST /try/:id/check with {"section", "answers"}: check.ts for a trial test, which anyone can take and nothing saves. */
export async function action({ request, params }: Route.ActionArgs) {
  const test = getTrialTest(params.id);
  if (!test) throw testNotFound();
  const body = checkSchema.safeParse(await request.json().catch(() => null));
  const section = body.success ? gradeTest(test.payload, body.data.answers).sections[body.data.section - 1] : undefined;
  if (!section) {
    return data({ error: translate(requestLocale(request), msg`This part couldn't be checked. Please try again.`) }, { status: 400 });
  }
  return { section };
}
