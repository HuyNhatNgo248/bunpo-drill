import { msg } from "@lingui/core/macro";
import type { Route } from "./+types/reading";
import type { TabsHandle } from "~/components/layout/TabsLayout";
import { ReadingHome } from "~/components/reading";
import { requireUserId } from "~/lib/auth.server";
import { titleMeta } from "~/lib/i18n";
import { JLPT_LEVELS } from "~/lib/payload";
import { listReadingSets, toReadingHome } from "~/lib/reading.server";
import { lastTabOf, ownerId, saveLastTab } from "~/lib/users.server";
import { revalidateUnlessPicked } from "~/lib/utils";

export const meta = titleMeta(msg`Reading`);

export const handle: TabsHandle = { levels: true };

export async function loader({ request }: Route.LoaderArgs) {
  const param = new URL(request.url).searchParams.get("level");
  const userId = await requireUserId(request);
  const named = JLPT_LEVELS.find((candidate) => candidate === param);
  // The level named, else the one the user last opened on any tab, else N2, the level the sets are made for.
  const level = named ?? (await lastTabOf(userId))?.level ?? "N2";
  // Not awaited: a missed save only costs the next visit its tab.
  saveLastTab(userId, { subject: "reading", level }).catch(console.error);
  const [sets, owner] = await Promise.all([listReadingSets(level, userId), ownerId()]);
  // `level` again at the top, where TabsLayout reads it for the subject tabs. The admin can rename and delete sets.
  return { home: toReadingHome(level, sets), level, isAdmin: userId === owner };
}

/** A group picked (`group`) the page shows by itself, so the sets aren't loaded again for it. */
export const shouldRevalidate = revalidateUnlessPicked("group");

export default function ReadingRoute({ loaderData }: Route.ComponentProps) {
  return <ReadingHome home={loaderData.home} isAdmin={loaderData.isAdmin} />;
}
