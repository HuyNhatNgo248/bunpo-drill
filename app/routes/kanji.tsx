import { msg } from "@lingui/core/macro";
import type { Route } from "./+types/kanji";
import { KanjiHome } from "~/components/kanji";
import type { TabsHandle } from "~/components/layout/TabsLayout";
import { requireUserId } from "~/lib/auth.server";
import { titleMeta } from "~/lib/i18n";
import { chapterLevels, latestKanjiTests, learnedIds, listChapters } from "~/lib/kanji.server";
import { toKanjiHome } from "~/lib/kanji-views.server";
import { isTestLevel, JLPT_LEVELS, KANJI_LEVEL } from "~/lib/payload";
import { lastTabOf, saveLastTab } from "~/lib/users.server";

export const meta = titleMeta(msg`Kanji`);

export const handle: TabsHandle = { levels: true };

export async function loader({ request }: Route.LoaderArgs) {
  const param = new URL(request.url).searchParams.get("level");
  const userId = await requireUserId(request);
  const named = JLPT_LEVELS.find((candidate) => candidate === param);
  const [last, levels] = named ? [null, []] : await Promise.all([lastTabOf(userId), chapterLevels()]);
  // The level named, else the level the user last opened, grammar or kanji (on any device), else the hardest that has a
  // chapter, else the level of the book.
  const level = named ?? last?.level ?? levels.at(-1) ?? KANJI_LEVEL;
  // Not awaited: the write is the slowest query, and a missed save only costs the next visit its tab.
  saveLastTab(userId, { subject: "kanji", level }).catch(console.error);
  if (!isTestLevel(level)) {
    return { home: { level, chapters: [], stats: { learned: 0, words: 0, average: null, missed: 0 } }, level };
  }
  const [chapters, learned, latest] = await Promise.all([listChapters(level), learnedIds(userId), latestKanjiTests(level, userId)]);
  // `level` again at the top, where TabsLayout reads it for the subject tabs.
  return { home: toKanjiHome(level, chapters, learned, latest), level };
}

export default function KanjiRoute({ loaderData }: Route.ComponentProps) {
  return <KanjiHome home={loaderData.home} />;
}
