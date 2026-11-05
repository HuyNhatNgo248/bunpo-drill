import { msg } from "@lingui/core/macro";
import { data, redirect, useLocation, type ShouldRevalidateFunction } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/flashcards";
import { Flashcards } from "~/components/flashcards";
import { requireUserId } from "~/lib/auth.server";
import { chapterNotFound } from "~/lib/errors";
import { localeFromMatches, translate } from "~/lib/i18n";
import { getChapter, latestKanjiTests, learnedIds, markLearned, markUnlearned } from "~/lib/kanji.server";
import { chapterWords, toFlashcards } from "~/lib/kanji-views.server";
import { cardsOf } from "~/lib/links";
import { chapterTitle } from "~/lib/sections";
import { LEVELS } from "~/lib/payload";

export function meta({ matches, loaderData }: Route.MetaArgs) {
  const name = translate(localeFromMatches(matches), msg`Flashcards`);
  return [{ title: loaderData ? `${loaderData.cards.lesson?.title ?? chapterTitle(loaderData.cards.title)} · ${name} · 文法ドリル` : `${name} · 文法ドリル` }];
}

/** The level of /kanji/:level/…, or a 404. */
function levelOf(params: { level: string }) {
  const level = LEVELS.find((candidate) => candidate === params.level);
  if (!level) throw chapterNotFound();
  return level;
}

/** The chapter of /kanji/:level/:chapter/cards, or a 404 when its words haven't been sent. */
async function chapterOf(params: { level: string; chapter: string }) {
  const level = levelOf(params);
  const number = Number(params.chapter);
  const chapter = Number.isInteger(number) ? await getChapter(level, number) : null;
  if (!chapter) throw chapterNotFound();
  return chapter;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const level = levelOf(params);
  const search = new URL(request.url).searchParams;
  const words = search.get("words");
  const userId = await requireUserId(request);
  const [chapter, learned, latest] = await Promise.all([chapterOf(params), learnedIds(userId), latestKanjiTests(level, userId)]);
  // ?page=21: the lesson on that page of the book, or a 404 for a page that is none of the chapter's.
  const page = search.get("page");
  const lesson = page === null ? null : chapter.lessons.find((candidate) => candidate.page === Number(page));
  if (lesson === undefined) throw chapterNotFound();
  const cards = toFlashcards(chapter, learned, latest.get(chapter.chapter), words ? words.split(",") : null, lesson && { title: lesson.title, page: lesson.page }, {
    seen: search.get("seen")?.split(",") ?? [],
    review: search.has("review"),
  });
  return { cards };
}

const BODY = z.union([
  z.object({ wordId: z.string(), learned: z.boolean().default(true) }),
  z.object({ reset: z.literal(true), page: z.number().optional() }),
]);

/**
 * POST {"wordId"}: a card got right the first time is learned; {"wordId", "learned": false} takes it back (an undo, or
 * "not learned" on a card). {"reset": true, "page"?}: every word of the chapter (or of the lesson on `page`) is unlearned,
 * and the session starts over.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const chapter = await chapterOf(params);
  const body = BODY.safeParse(await request.json().catch(() => null));
  const words = chapterWords(chapter);
  const unknown = body.success && "wordId" in body.data && !words.some((word) => word.id === (body.data as { wordId: string }).wordId);
  if (!body.success || unknown) {
    return data({ error: "Body must be {\"wordId\"} of a word of this chapter, or {\"reset\": true}." }, { status: 400 });
  }
  const userId = await requireUserId(request);
  if ("reset" in body.data) {
    const { page } = body.data;
    await markUnlearned(userId, words.filter((word) => page === undefined || word.lesson.page === page).map((word) => word.id));
    return redirect(cardsOf(chapter.level, chapter.chapter, { page }));
  }
  if (!body.data.learned) {
    await markUnlearned(userId, [body.data.wordId]);
    return { unlearned: body.data.wordId };
  }
  await markLearned(userId, body.data.wordId);
  return { learned: body.data.wordId };
}

/**
 * A card marked learned (or not) changes nothing the session shows, so its POST doesn't load the cards again; a reset
 * does, through its redirect, which still carries the POST.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({ formMethod, json, defaultShouldRevalidate }) =>
  formMethod === "POST" && (json as { wordId?: string } | undefined)?.wordId ? false : defaultShouldRevalidate;

export default function FlashcardsRoute({ loaderData }: Route.ComponentProps) {
  // Each visit is a new session, "Next 20 cards" on the same URL included.
  return <Flashcards key={useLocation().key} view={loaderData.cards} />;
}
