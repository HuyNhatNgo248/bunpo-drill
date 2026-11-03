import { z } from "zod";
import type { Route } from "./+types/api.tests.$id";
import { requireAdmin, requireUserId } from "~/lib/auth.server";
import { testPayloadSchema } from "~/lib/payload";
import { deleteTest, renameTest, setReviewed } from "~/lib/tests.server";

const reviewedSchema = z.object({ grammarId: z.string().min(1), reviewed: z.boolean() });
// The payload's own title rule, after trimming, so a renamed test stays a valid payload.
const titleSchema = z.object({ title: z.string().trim().pipe(testPayloadSchema.shape.title) });

/**
 * DELETE /api/tests/:id: delete one test, for every user. Admin only.
 * PATCH /api/tests/:id with {"grammarId", "reviewed"}: mark a review chip.
 * PATCH /api/tests/:id with {"title"}: rename one test, for every user. Admin only.
 */
export async function action({ request, params }: Route.ActionArgs) {
  switch (request.method) {
    case "DELETE": {
      await requireAdmin(request);
      return (await deleteTest(params.id))
        ? Response.json({ deleted: params.id })
        : Response.json({ error: "Test not found." }, { status: 404 });
    }
    case "PATCH": {
      const body: unknown = await request.json().catch(() => null);
      if (typeof body === "object" && body !== null && "title" in body) {
        await requireAdmin(request);
        const renamed = titleSchema.safeParse(body);
        if (!renamed.success) {
          return Response.json({ error: 'Body must be {"title": string of 1 to 60 characters}.' }, { status: 400 });
        }
        return (await renameTest(params.id, renamed.data.title))
          ? Response.json({ title: renamed.data.title })
          : Response.json({ error: "Test not found." }, { status: 404 });
      }
      const parsed = reviewedSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: 'Body must be {"grammarId": string, "reviewed": boolean}.' }, { status: 400 });
      }
      const test = await setReviewed(await requireUserId(request), params.id, parsed.data.grammarId, parsed.data.reviewed);
      return test
        ? Response.json({ reviewed: test.reviewed })
        : Response.json({ error: "Test not found." }, { status: 404 });
    }
    default:
      return Response.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "PATCH, DELETE" } });
  }
}
