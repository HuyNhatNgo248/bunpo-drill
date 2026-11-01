import type { Route } from "./+types/draft";
import { draftSchema } from "~/lib/grading.server";
import { saveDraft } from "~/lib/tests.server";

/**
 * POST /tests/:id/draft with {"answers", "checked"}: saves where the quiz is, as it changes, so the test goes on from
 * there on any device. A test that is submitted, or that does not exist, keeps nothing.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const body = draftSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: 'Body must be {"answers": {…}, "checked": number[]}.' }, { status: 400 });
  await saveDraft(params.id, body.data);
  return new Response(null, { status: 204 });
}
