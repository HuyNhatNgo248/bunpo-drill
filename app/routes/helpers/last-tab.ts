import type { Route } from "./+types/last-tab";
import { requireUserId } from "~/lib/auth.server";
import { parseTab } from "~/lib/lastTab";
import { saveLastTab } from "~/lib/users.server";

/**
 * POST /last-tab with a tab as the body ("kanji:N2"): the list page just opened, where the app opens next time on any
 * device. Sent by the page, not saved by its loader, so a tab link's prefetch saves nothing.
 */
export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const tab = parseTab(await request.text());
  if (!tab) return new Response("Body must be a tab, like kanji:N2.", { status: 400 });
  await saveLastTab(userId, tab);
  return new Response(null, { status: 204 });
}
