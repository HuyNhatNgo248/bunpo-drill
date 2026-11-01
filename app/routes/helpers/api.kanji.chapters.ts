import type { Route } from "./+types/api.kanji.chapters";
import { saveChapter } from "~/lib/kanji.server";
import { chapterWords } from "~/lib/kanji-views.server";
import { kanjiChapterSchema } from "~/lib/kanji-payload";
import { issuesOf } from "~/lib/payload";

/**
 * POST /api/kanji/chapters: save a chapter of 漢字マスター, the words its flashcards show. Sending a chapter again
 * replaces it; the words' learned marks stay.
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } });
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
