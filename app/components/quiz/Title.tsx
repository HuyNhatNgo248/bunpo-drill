import { Badge } from "~/components/ui/badge";
import type { QuizView } from "~/lib/views";

/** Desktop: the level, the question count and the title. */
export function Title({ quiz }: { quiz: QuizView }) {
  return (
    <div className="hidden flex-col gap-2 md:flex">
      <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
        <Badge>{quiz.level}</Badge>
        <span>{quiz.questionCount}問</span>
      </div>
      <h1 className="text-title font-bold tracking-tight">{quiz.title}</h1>
    </div>
  );
}
