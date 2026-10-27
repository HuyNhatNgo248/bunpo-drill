import { z } from "zod";
import type { Route } from "./+types/api.test";
import { deleteTest, setReviewed } from "~/lib/tests.server";

const reviewedSchema = z.object({ grammarId: z.string().min(1), reviewed: z.boolean() });

/**
 * DELETE /api/tests/:id: delete one test.
 * PATCH /api/tests/:id with {"grammarId", "reviewed"}: mark a review chip.
 */
export async function action({ request, params }: Route.ActionArgs) {
  switch (request.method) {
    case "DELETE": {
      const deleted = await deleteTest(params.id);
      return deleted
        ? Response.json({ deleted: params.id })
        : Response.json({ error: "Test not found." }, { status: 404 });
    }
    case "PATCH": {
      const parsed = reviewedSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return Response.json({ error: 'Body must be {"grammarId": string, "reviewed": boolean}.' }, { status: 400 });
      }
      const test = await setReviewed(params.id, parsed.data.grammarId, parsed.data.reviewed);
      return test
        ? Response.json({ reviewed: test.reviewed })
        : Response.json({ error: "Test not found." }, { status: 404 });
    }
    default:
      return Response.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "PATCH, DELETE" } });
  }
}
