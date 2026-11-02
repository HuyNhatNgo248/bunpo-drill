import { Trans } from "@lingui/react/macro";
import { Link } from "react-router";
import { RetakeButton } from "~/components/RetakeButton";
import { Button } from "~/components/ui/button";
import { homeOf } from "~/lib/links";
import { cn } from "~/lib/utils";
import type { ResultsView } from "~/lib/views";

/** Back to the list (the mock tests, or kanji), or take the test again. A `trial` test: take it again, or sign up. */
export function Actions({
  results,
  trial = false,
}: {
  results: Pick<ResultsView, "id" | "kind" | "level" | "score" | "total">;
  trial?: boolean;
}) {
  if (trial) {
    return (
      <div className="mt-1 grid grid-cols-2 gap-2 md:mt-0 md:flex md:justify-end">
        {/* The results were never saved, so opening the test again starts it fresh. */}
        <Button asChild variant="outline" size="lg">
          <Link to={`/try/${results.id}`}>
            <Trans>Take it again</Trans>
          </Link>
        </Button>
        <Button asChild size="lg" className="font-semibold md:px-5 md:font-medium">
          <Link to="/signup">
            <Trans>Create account</Trans>
          </Link>
        </Button>
      </div>
    );
  }
  const missed = results.score < results.total;
  return (
    <div className="mt-1 grid grid-cols-2 gap-2 md:mt-0 md:flex md:justify-end">
      <Button asChild variant="outline" size="lg" className={cn(missed && "col-span-2")}>
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
      {missed && (
        // The quiz asks only the wrong ones; the right answers are kept, so the score is still out of the whole test.
        <RetakeButton testId={results.id} wrongOnly variant="outline" size="lg">
          <Trans>Retake wrong ones</Trans>
        </RetakeButton>
      )}
      <RetakeButton testId={results.id} size="lg" className="font-semibold md:px-5 md:font-medium">
        <Trans>Take it again</Trans>
      </RetakeButton>
    </div>
  );
}
