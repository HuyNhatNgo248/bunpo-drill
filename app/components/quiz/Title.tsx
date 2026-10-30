import { Plural, Trans } from "@lingui/react/macro";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import type { QuizView } from "~/lib/views";

/** Desktop: the level and the question count with the way back to the mock tests at the right, then the title. */
export function Title({ quiz }: { quiz: QuizView }) {
  const total = quiz.questionCount;
  return (
    <div className="hidden flex-col gap-2 md:flex">
      <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
        <Badge>{quiz.level}</Badge>
        <span>
          <Plural value={total} one="# question" other="# questions" />
        </span>
        <Link to="/" className="ml-auto text-subtle-foreground no-underline hover:text-foreground">
          <Trans>← Mock tests</Trans>
        </Link>
      </div>
      <h1 className="text-title font-bold tracking-tight">{quiz.title}</h1>
    </div>
  );
}
