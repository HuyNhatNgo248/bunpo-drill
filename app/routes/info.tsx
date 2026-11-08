import { msg } from "@lingui/core/macro";
import { data } from "react-router";
import type { Route } from "./+types/info";
import { Info } from "~/components/info";
import { requireUserId } from "~/lib/auth.server";
import { titleMeta } from "~/lib/i18n";
import type { TestKind } from "~/lib/views";

export const meta = titleMeta(msg`What's on the test`);

const SUBJECTS: TestKind[] = ["grammar", "kanji", "reading"];

/** GET /info/:subject: what the grammar, kanji or reading test holds. Any other subject is not found. */
export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUserId(request);
  const subject = SUBJECTS.find((kind) => kind === params.subject);
  if (!subject) throw data("Not found", { status: 404 });
  return { subject };
}

export default function InfoRoute({ loaderData }: Route.ComponentProps) {
  return <Info subject={loaderData.subject} />;
}
