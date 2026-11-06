import { useLingui } from "@lingui/react/macro";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { ChapterSummary } from "~/lib/views";

/**
 * A chapter's newest quiz, as a row like a mock test's: Start before it is taken; its score and its results after. The
 * whole row opens it.
 */
export function QuizRow({ quiz }: { quiz: NonNullable<ChapterSummary["quiz"]> }) {
  const { t } = useLingui();
  const { result } = quiz;
  return (
    <div className="relative flex min-h-16 items-center gap-4 rounded-xl border bg-card px-5 py-3 transition-colors hover:bg-muted/60">
      <Link
        to={result ? `/tests/${quiz.id}/results` : `/tests/${quiz.id}`}
        prefetch="intent"
        className="min-w-0 flex-1 truncate text-base font-semibold text-foreground no-underline after:absolute after:inset-0"
      >
        {t`Quiz`}
      </Link>
      {result ? (
        <>
          <Badge variant="outline" className="text-sm font-semibold tabular-nums">
            {result.score} / {result.total}
          </Badge>
          <span className={cn(buttonVariants({ variant: "outline" }))}>
            {t`Results`}
          </span>
        </>
      ) : (
        <span className={buttonVariants()}>{t`Start`}</span>
      )}
    </div>
  );
}
