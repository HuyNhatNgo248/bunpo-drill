import { Trans } from "@lingui/react/macro";
import { Form, Link } from "react-router";
import { Button } from "~/components/ui/button";

/** Back to the list, or take the test again. */
export function Actions({ testId }: { testId: string }) {
  return (
    <div className="mt-1 grid grid-cols-2 gap-2 md:mt-0 md:flex md:justify-end">
      <Button asChild variant="outline" size="lg">
        <Link to="/">
          <span className="md:hidden">
            <Trans>Mock tests</Trans>
          </span>
          <span className="hidden md:inline">
            <Trans>Back to the mock tests</Trans>
          </span>
        </Link>
      </Button>
      {/* Retake clears this result and the review chips, then opens the quiz. */}
      <Form method="post" action={`/tests/${testId}/retake`} className="contents">
        <Button type="submit" size="lg" className="font-semibold md:px-5 md:font-medium">
          <Trans>Take it again</Trans>
        </Button>
      </Form>
    </div>
  );
}
