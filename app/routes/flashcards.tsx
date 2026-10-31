import { msg } from "@lingui/core/macro";
import { data, useLocation, type ShouldRevalidateFunction } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/flashcards";
import { Flashcards } from "~/components/flashcards";
import { chapterNotFound } from "~/lib/errors";
import { localeFromMatches, translate } from "~/lib/i18n";
import { getChapter, latestKanjiTests, learnedIds, markLearned } from "~/lib/kanji.server";
import { chapterWords, toFlashcards } from "~/lib/kanji-views.server";
import { LEVELS } from "~/lib/payload";

export function meta({ matches, loaderData }: Route.MetaArgs) {
  const name = translate(localeFromMatches(matches), msg`Flashcards`);
  return [{ title: loaderData ? `${loaderData.cards.title} · ${name} · 文法ドリル` : `${name} · 文法ドリル` }];
}

/** The chapter of /kanji/:level/:chapter/cards, or a 404 when its words haven't been sent. */
async function chapterOf(params: { level: string; chapter: string }) {
  const level = LEVELS.find((candidate) => candidate === params.level);
  const number = Number(params.chapter);
  const chapter = level && Number.isInteger(number) ? await getChapter(level, number) : null;
  if (!chapter) throw chapterNotFound();
  return chapter;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const chapter = await chapterOf(params);
  const words = new URL(request.url).searchParams.get("words");
  const [learned, latest] = await Promise.all([learnedIds(), latestKanjiTests(chapter.level)]);
  return { cards: toFlashcards(chapter, learned, latest.get(chapter.chapter), words ? words.split(",") : null) };
}

/** POST {"wordId"}: a card got right the first time is learned. */
export async function action({ request, params }: Route.ActionArgs) {
  const chapter = await chapterOf(params);
  const body = z.object({ wordId: z.string() }).safeParse(await request.json().catch(() => null));
  if (!body.success || !chapterWords(chapter).some((word) => word.id === body.data.wordId)) {
    return data({ error: "Body must be {\"wordId\"} of a word of this chapter." }, { status: 400 });
  }
  await markLearned(body.data.wordId);
  return { learned: body.data.wordId };
}

/** A card marked learned changes nothing the session shows, so its POST doesn't load the cards again. */
export const shouldRevalidate: ShouldRevalidateFunction = ({ formMethod, defaultShouldRevalidate }) =>
  formMethod === "POST" ? false : defaultShouldRevalidate;

export default function FlashcardsRoute({ loaderData }: Route.ComponentProps) {
  // Each visit is a new session, "Next 20 cards" on the same URL included.
  return <Flashcards key={useLocation().key} view={loaderData.cards} />;
}
