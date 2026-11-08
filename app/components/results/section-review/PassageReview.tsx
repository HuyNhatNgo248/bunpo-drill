import { useLocation } from "react-router";
import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { NotedText } from "~/components/noted-text";
import { passageAnchor } from "~/lib/sections";
import { trackPassageHeight } from "~/components/quiz/helpers/passageHeight";
import type { ResultSegment } from "~/lib/views";

/** The passage with every blank filled in: green if answered right, red if not. It pins at `className`'s top. */
export function PassageReview({ segments, className }: { segments: ResultSegment[]; className?: string }) {
  const id = passageAnchor(segments);
  // Opened from a note's link to this passage.
  const arrived = useLocation().hash === `#${id}`;
  return (
    <Card id={id} ref={trackPassageHeight} className={cn("sticky z-10 mt-1 max-h-passage scroll-mt-4 overflow-y-auto p-4 shadow-raised md:max-h-passage-desktop md:scroll-mt-6 md:p-5", className, arrived && "animate-arrived motion-reduce:animate-none")}>
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
