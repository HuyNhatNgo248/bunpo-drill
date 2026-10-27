import { Badge } from "~/components/ui/badge";
import type { ResultsView } from "~/lib/views";

/** Desktop: the level, the test title and the 結果 heading. */
export function Title({ results }: { results: ResultsView }) {
  return (
    <div className="hidden flex-col gap-2 md:flex">
      <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
        <Badge>{results.level}</Badge>
        <span>{results.title}</span>
      </div>
      <h1 className="text-title font-bold tracking-tight">結果</h1>
    </div>
  );
}
