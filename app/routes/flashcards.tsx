import { msg } from "@lingui/core/macro";
import { data, useLocation, type ShouldRevalidateFunction } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/flashcards";
import { Flashcards } from "~/components/flashcards";
import { requireUserId } from "~/lib/auth.server";
import { chapterNotFound } from "~/lib/errors";
import { localeFromMatches, translate } from "~/lib/i18n";
import { getChapter, latestKanjiTests, learnedIds, markLearned } from "~/lib/kanji.server";
import { chapterWords, toFlashcards } from "~/lib/kanji-views.server";
import { LEVELS } from "~/lib/payload";

export function meta({ matches, loaderData }: Route.MetaArgs) {
  const name = translate(localeFromMatches(matches), msg`Flashcards`);
  return [{ title: loaderData ? `${loaderData.cards.lesson?.title ?? loaderData.cards.title} · ${name} · 文法ドリル` : `${name} · 文法ドリル` }];
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
  const cards = toFlashcards(chapter, learned, latest.get(chapter.chapter), words ? words.split(",") : null, lesson && { title: lesson.title, page: lesson.page });
  return { cards };
}

/** POST {"wordId"}: a card got right the first time is learned. */
export async function action({ request, params }: Route.ActionArgs) {
  const chapter = await chapterOf(params);
  const body = z.object({ wordId: z.string() }).safeParse(await request.json().catch(() => null));
  if (!body.success || !chapterWords(chapter).some((word) => word.id === body.data.wordId)) {
    return data({ error: "Body must be {\"wordId\"} of a word of this chapter." }, { status: 400 });
  }
  await markLearned(await requireUserId(request), body.data.wordId);
  return { learned: body.data.wordId };
}

/** A card marked learned changes nothing the session shows, so its POST doesn't load the cards again. */
export const shouldRevalidate: ShouldRevalidateFunction = ({ formMethod, defaultShouldRevalidate }) =>
  formMethod === "POST" ? false : defaultShouldRevalidate;

export default function FlashcardsRoute({ loaderData }: Route.ComponentProps) {
  // Each visit is a new session, "Next 20 cards" on the same URL included.
  return <Flashcards key={useLocation().key} view={loaderData.cards} />;
}
