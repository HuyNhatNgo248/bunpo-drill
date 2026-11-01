import { msg } from "@lingui/core/macro";
import type { Route } from "./+types/kanji";
import { KanjiHome } from "~/components/kanji";
import { requireUserId } from "~/lib/auth.server";
import { localeFromMatches, translate } from "~/lib/i18n";
import { chapterLevels, latestKanjiTests, learnedIds, listChapters } from "~/lib/kanji.server";
import { toKanjiHome } from "~/lib/kanji-views.server";
import { isTestLevel, JLPT_LEVELS, KANJI_LEVEL } from "~/lib/payload";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Kanji`)} · 文法ドリル` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const param = new URL(request.url).searchParams.get("level");
  // The level in ?level=, else the hardest that has a chapter, else the level of the book.
  const level = JLPT_LEVELS.find((candidate) => candidate === param) ?? (await chapterLevels()).at(-1) ?? KANJI_LEVEL;
  if (!isTestLevel(level)) return { home: { level, chapters: [], stats: { learned: 0, words: 0, average: null, missed: 0 } } };
  const userId = await requireUserId(request);
  const [chapters, learned, latest] = await Promise.all([listChapters(level), learnedIds(userId), latestKanjiTests(level, userId)]);
  return { home: toKanjiHome(level, chapters, learned, latest) };
}

export default function KanjiRoute({ loaderData }: Route.ComponentProps) {
  return <KanjiHome home={loaderData.home} />;
}
