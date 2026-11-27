import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { useId } from "react";
import { Link } from "react-router";
import { buttonVariants } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";
import type { TestSummary } from "~/lib/views";

/** The test to take next, large: the one under way (with how far it got, to continue) or one not taken yet. The whole card opens it. */
export function NextTest({ test }: { test: TestSummary }) {
  const { t } = useLingui();
  const id = useId();
  const { answered } = test;
  const total = test.questionCount;
  return (
    <Card aria-labelledby={id} className="relative flex min-w-0 flex-1 flex-col gap-4 p-5 shadow-raised transition-colors hover:bg-muted/60 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span id={id} className="text-caption font-semibold text-primary">{answered === null ? t`Next test` : t`In progress`}</span>
        {/* Its ::after covers the card, so the whole card opens the test; the button is only its look. */}
        <Link to={`/tests/${test.id}`} prefetch="intent" className="truncate text-xl font-bold text-foreground no-underline after:absolute after:inset-0">
          {test.title}
        </Link>
        {answered === null ? (
          <span className="text-caption tabular-nums text-muted-foreground">
            <Plural value={total} one="# question" other="# questions" />
          </span>
        ) : (
          <span className="flex items-center gap-2.5">
            <Progress aria-hidden="true" value={(answered / total) * 100} className="h-1.5 max-w-56" />
            <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
              <Trans>
                {answered} / {total} answered
              </Trans>
            </span>
          </span>
        )}
      </div>
      <span className={cn(buttonVariants({ size: "lg" }), "min-w-32")}>{answered === null ? t`Start` : t`Continue`}</span>
    </Card>
  );
}
