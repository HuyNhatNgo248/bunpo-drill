import { z } from "zod";
import type { Route } from "./+types/api.tests";
import { toSummary } from "~/lib/grading.server";
import { getChapter } from "~/lib/kanji.server";
import { chapterWords } from "~/lib/kanji-views.server";
import type { KanjiTestPayload } from "~/lib/kanji-payload";
import type { PayloadIssue } from "~/lib/payload";
import { isKanji, parseAnyPayload } from "~/lib/test-kinds";
import { createTest, deleteAllTests, listTests, saveOrder } from "~/lib/tests.server";

const orderSchema = z.object({ order: z.array(z.string()) });

/** GET /api/tests: every saved test with its last score and the grammar to review. */
export async function loader(_: Route.LoaderArgs) {
  const tests = await listTests();
  return Response.json({ tests: tests.map(toSummary) });
}

/**
 * POST /api/tests: save a new test (the standard v1 payload, or a kanji test on a chapter already sent).
 * PATCH /api/tests with {"order": [id, …]}: order those tests, top first, among the places they hold in the list.
 * DELETE /api/tests: clear all tests.
 */
export async function action({ request }: Route.ActionArgs) {
  switch (request.method) {
    case "POST": {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Body must be JSON." }, { status: 400 });
      }
      const parsed = parseAnyPayload(body);
      if (!parsed.ok) {
        return Response.json({ error: "Invalid payload.", issues: parsed.issues }, { status: 400 });
      }
      const issues = isKanji(parsed.payload) ? await chapterIssues(parsed.payload) : [];
      if (issues.length) {
        return Response.json({ error: "Invalid payload.", issues }, { status: 400 });
      }
      const test = await createTest(parsed.payload);
      const url = new URL(`/tests/${test.id}`, request.url).toString();
      return Response.json({ id: test.id, url }, { status: 201, headers: { Location: url } });
    }
    case "PATCH": {
      const parsed = orderSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return Response.json({ error: 'Body must be {"order": string[]}.' }, { status: 400 });
      }
      return Response.json({ order: await saveOrder(parsed.data.order) });
    }
    case "DELETE": {
      const deleted = await deleteAllTests();
      return Response.json({ deleted });
    }
    default:
      return Response.json(
        { error: "Method not allowed." },
        { status: 405, headers: { Allow: "GET, POST, PATCH, DELETE" } },
      );
  }
}

/** A kanji test's words must be its chapter's, as the chapter writes them, so a miss always has a flashcard. */
async function chapterIssues(payload: KanjiTestPayload): Promise<PayloadIssue[]> {
  const chapter = await getChapter(payload.level, payload.chapter);
  if (!chapter) {
    return [{ path: "chapter", message: `${payload.level} chapter ${payload.chapter} isn't saved. POST it to /api/kanji/chapters first.` }];
  }
  const known = new Map(chapterWords(chapter).map((word) => [word.id, word]));
  return payload.words.flatMap((word, i) => {
    const saved = known.get(word.id);
    if (!saved) return [{ path: `words.${i}.id`, message: `"${word.word}" is not a word of this chapter.` }];
    return saved.reading === word.reading ? [] : [{ path: `words.${i}.reading`, message: `The chapter reads ${word.word} as ${saved.reading}.` }];
  });
}
