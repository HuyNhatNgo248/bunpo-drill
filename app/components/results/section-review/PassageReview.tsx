import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { NotedText } from "~/components/noted-text";
import { passageAnchor } from "~/lib/sections";
import type { ResultSegment } from "~/lib/views";

/** The passage with every blank filled in: green if answered right, red if not. */
export function PassageReview({ segments }: { segments: ResultSegment[] }) {
  return (
    <Card id={passageAnchor(segments)} className="mt-1 scroll-mt-4 p-4 md:scroll-mt-6 md:p-5">
      <p
        lang="ja"
        data-note-sentence={segments.map((segment) => (segment.kind === "text" ? segment.text : `（${segment.num}）${segment.fill}`)).join("")}
        className="font-jp text-base leading-passage md:text-prompt"
      >
        {segments.map((segment, i) =>
          segment.kind === "text" ? (
            <span key={i}>
              <NotedText text={segment.text} />
            </span>
          ) : (
            <span
              key={i}
              className={cn(
                "mx-0.75 inline-block rounded-md border px-2 text-sm leading-7 font-medium md:mx-1 md:px-2.5 md:text-body-sm md:leading-7.5",
                segment.correct
                  ? "border-success-border bg-success-soft text-success"
                  : "border-primary-border bg-primary-soft text-primary-soft-foreground",
              )}
            >
              （{segment.num}）{segment.fill}
            </span>
          ),
        )}
      </p>
    </Card>
  );
}
