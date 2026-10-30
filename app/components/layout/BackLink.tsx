import { Trans } from "@lingui/react/macro";
import { Link } from "react-router";

/** The way back to the mock tests, at the top of a page's desktop title. On a phone, the header's back chevron does this. */
export function BackLink() {
  return (
    <Link to="/" className="self-start text-caption text-subtle-foreground no-underline hover:text-foreground">
      <Trans>← Mock tests</Trans>
    </Link>
  );
}
