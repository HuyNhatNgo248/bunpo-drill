import { msg } from "@lingui/core/macro";
import type { Route } from "./+types/reading";
import type { TabsHandle } from "~/components/layout/TabsLayout";
import { tabClientLoader, useRefreshStale } from "~/components/layout/tabCache";
import { ReadingHome } from "~/components/reading";
import { requireUserId } from "~/lib/auth.server";
import { titleMeta } from "~/lib/i18n";
import { JLPT_LEVELS } from "~/lib/payload";
import { listReadingSets, toReadingHome } from "~/lib/reading.server";
import { lastTabOf, ownerId } from "~/lib/users.server";
import { revalidateUnlessPicked } from "~/lib/utils";

export const meta = titleMeta(msg`Reading`);

export const handle: TabsHandle = { levels: true };

export async function loader({ request }: Route.LoaderArgs) {
  const param = new URL(request.url).searchParams.get("level");
  const userId = await requireUserId(request);
  const named = JLPT_LEVELS.find((candidate) => candidate === param);
  // The level named, else the one the user last opened on any tab, else N2, the level the sets are made for.
  const level = named ?? (await lastTabOf(userId))?.level ?? "N2";
  const [sets, owner] = await Promise.all([listReadingSets(level, userId), ownerId()]);
  // `level` again at the top, where TabsLayout reads it for the subject tabs. The admin can rename and delete sets.
  return { home: toReadingHome(level, sets), level, isAdmin: userId === owner };
}

/** Switching from another tab shows its last data at once (tabCache.ts). */
export const clientLoader = (args: Route.ClientLoaderArgs) => tabClientLoader(args);

/** A group picked (`group`) the page shows by itself, so the sets aren't loaded again for it. */
export const shouldRevalidate = revalidateUnlessPicked("group");

export default function ReadingRoute({ loaderData }: Route.ComponentProps) {
  useRefreshStale(loaderData);
  return <ReadingHome home={loaderData.home} isAdmin={loaderData.isAdmin} />;
}
