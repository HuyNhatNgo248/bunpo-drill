import { z } from "zod";
import type { Route } from "./+types/api.kanji.chapters";
import { saveChapter, saveChapterOrder } from "~/lib/kanji.server";
import { chapterWords } from "~/lib/kanji-views.server";
import { kanjiChapterSchema } from "~/lib/kanji-payload";
import { issuesOf, LEVELS } from "~/lib/payload";

const orderSchema = z.object({ level: z.enum(LEVELS), order: z.array(z.number().int()) });

/**
 * POST /api/kanji/chapters: save a chapter of 漢字マスター, the words its flashcards show. Sending a chapter again
 * replaces it; the words' learned marks stay.
 * PATCH /api/kanji/chapters with {"level": "N2", "order": [chapter, …]}: order that level's chapters, top first, among
 * the places they hold in the list.
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method === "PATCH") {
    const parsed = orderSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: 'Body must be {"level": "N2", "order": number[]}.' }, { status: 400 });
    }
    return Response.json({ order: await saveChapterOrder(parsed.data.level, parsed.data.order) });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "POST, PATCH" } });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = kanjiChapterSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid chapter.", issues: issuesOf(parsed.error) }, { status: 400 });
  }
  const chapter = parsed.data;
  await saveChapter(chapter);
  const url = new URL(`/kanji/${chapter.level}/${chapter.chapter}/cards`, request.url).toString();
  return Response.json(
    { level: chapter.level, chapter: chapter.chapter, words: chapterWords(chapter).length, url },
    { status: 201, headers: { Location: url } },
  );
}
