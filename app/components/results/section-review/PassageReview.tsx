import { cn } from "cn";
import { Card } from "~/components/ui/card";
import type { ResultSegment } from "~/lib/views";

/** The passage with every blank filled in: green if answered right, red if not. */
export function PassageReview({ segments }: { segments: ResultSegment[] }) {
  return (
    <Card className="mt-1 p-4 md:p-5">
      <p lang="ja" className="font-jp text-base leading-[2.2] md:text-[17px]">
        {segments.map((segment, i) =>
          segment.kind === "text" ? (
            <span key={i}>{segment.text}</span>
          ) : (
            <span
              key={i}
              className={cn(
                "mx-0.75 inline-block rounded-md border px-2 text-sm leading-7 font-medium md:mx-1 md:px-2.5 md:text-[15px] md:leading-7.5",
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
