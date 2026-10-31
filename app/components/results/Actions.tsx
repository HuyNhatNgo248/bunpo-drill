import { Trans } from "@lingui/react/macro";
import { Form, Link } from "react-router";
import { Button } from "~/components/ui/button";
import { homeOf } from "~/lib/links";
import type { ResultsView } from "~/lib/views";

/** Back to the list (the mock tests, or kanji), or take the test again. */
export function Actions({ results }: { results: Pick<ResultsView, "id" | "kind" | "level"> }) {
  return (
    <div className="mt-1 grid grid-cols-2 gap-2 md:mt-0 md:flex md:justify-end">
      <Button asChild variant="outline" size="lg">
        <Link to={homeOf(results)}>
          {results.kind === "kanji" ? (
            <>
              <span className="md:hidden">
                <Trans>Kanji</Trans>
              </span>
              <span className="hidden md:inline">
                <Trans>Back to kanji</Trans>
              </span>
            </>
          ) : (
            <>
              <span className="md:hidden">
                <Trans>Mock tests</Trans>
              </span>
              <span className="hidden md:inline">
                <Trans>Back to the mock tests</Trans>
              </span>
            </>
          )}
        </Link>
      </Button>
      {/* Retake clears this result and the review chips, then opens the quiz. */}
      <Form method="post" action={`/tests/${results.id}/retake`} className="contents">
        <Button type="submit" size="lg" className="font-semibold md:px-5 md:font-medium">
          <Trans>Take it again</Trans>
        </Button>
      </Form>
    </div>
  );
}
