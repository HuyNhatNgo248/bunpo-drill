import { useLingui } from "@lingui/react/macro";
import { CircleHelp } from "lucide-react";
import { Link } from "react-router";
import type { TestKind } from "~/lib/views";

/** The link from a subject's page to what its test holds, quiet, at the end of the heading row of the page's list. */
export function InfoLink({ subject }: { subject: TestKind }) {
  const { t } = useLingui();
  return (
    <Link to={`/info/${subject}`} className="flex items-center gap-1.5 text-caption text-muted-foreground no-underline hover:text-foreground">
      <CircleHelp aria-hidden="true" className="size-3.5" />
      {t`What's on the test`}
    </Link>
  );
}
