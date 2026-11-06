import { msg } from "@lingui/core/macro";
import type { Route } from "./+types/home";
import { Home } from "~/components/home";
import type { TabsHandle } from "~/components/layout/TabsLayout";
import { tabClientLoader, useRefreshStale } from "~/components/layout/tabCache";
import { requireUserId } from "~/lib/auth.server";
import { toSummary } from "~/lib/grading.server";
import { isTestLevel, JLPT_LEVELS } from "~/lib/payload";
import { listTests, newestLevel } from "~/lib/tests.server";
import { lastTabOf, ownerId } from "~/lib/users.server";
import { titleMeta } from "~/lib/i18n";
import { revalidateUnlessPicked } from "~/lib/utils";

export const meta = titleMeta(msg`Mock tests`);

export const handle: TabsHandle = { levels: true };

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const userId = await requireUserId(request);
  const named = JLPT_LEVELS.find((candidate) => candidate === params.get("level"));
  // Opened with no level (the app's address, or a sign-in): the level the user last opened, grammar or kanji, on any device.
  const [last, newest] = named ? [null, null] : await Promise.all([lastTabOf(userId), newestLevel()]);
  // One level at a time: the one named, with tests or not, else the last one opened, else the level of the newest test.
  // Not the top test's: a test of another level can sort above it.
  const level = named ?? last?.level ?? newest;
  if (!level || !isTestLevel(level)) {
    return { tests: [], level, isAdmin: false };
  }
  const [tests, owner] = await Promise.all([listTests(userId, { level }), ownerId()]);
  // Only shows the rename and delete menu; /api/tests/:id checks the admin again.
  return { tests: tests.map(toSummary), level, isAdmin: userId === owner };
}

/** Switching from another tab shows its last data at once (tabCache.ts). */
export const clientLoader = (args: Route.ClientLoaderArgs) => tabClientLoader(args);

/** A week picked (`week`) the page shows by itself, so the tests aren't loaded again for it. */
export const shouldRevalidate = revalidateUnlessPicked("week");

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  useRefreshStale(loaderData);
  return <Home {...loaderData} />;
}
