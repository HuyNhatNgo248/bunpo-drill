import { Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { Check } from "lucide-react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { circled, dayLabel, weekLabel } from "~/lib/sections";
import type { ReviewChip } from "~/lib/views";

/** One chip: tapping it opens where the point is in the 文法ノート, and a button to mark it reviewed. */
export function GrammarChip({ testId, chip }: { testId: string; chip: ReviewChip }) {
  const { t, i18n } = useLingui();
  const fetcher = useFetcher({ key: `review:${testId}:${chip.grammarId}` });
  const pending = fetcher.json as { reviewed: boolean } | undefined;
  const reviewed = pending ? pending.reviewed : chip.reviewed;
  const toggle = () =>
    fetcher.submit(
      { grammarId: chip.grammarId, reviewed: !reviewed },
      { method: "patch", action: `/api/tests/${testId}`, encType: "application/json" },
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-9 items-center gap-1 rounded-full border px-3.5 font-jp text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:min-h-8 md:px-3",
            reviewed
              ? "border-success-border bg-success-soft text-success"
              : "border-border bg-card text-foreground hover:bg-muted data-[state=open]:bg-muted",
          )}
        >
          {reviewed && <Check className="size-3.5" aria-hidden="true" />}
          <span lang="ja">{chip.pattern}</span>
          {reviewed && <span className="sr-only">{t`(reviewed)`}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-60 gap-3 border p-3.5 shadow-raised ring-0">
        <span lang="ja" className="font-jp text-base font-semibold">
          {chip.pattern}
        </span>
        <dl className="grid grid-cols-term gap-x-4 gap-y-1 text-caption">
          <dt className="text-muted-foreground">
            <Trans>Level</Trans>
          </dt>
          <dd className="font-medium">{chip.level}</dd>
          <dt className="text-muted-foreground">
            <Trans>Week</Trans>
          </dt>
          <dd className="font-medium">{weekLabel(i18n, chip.week)}</dd>
          <dt className="text-muted-foreground">
            <Trans>Day</Trans>
          </dt>
          <dd className="font-medium">{dayLabel(i18n, chip.day)}</dd>
          <dt className="text-muted-foreground">
            <Trans>Number</Trans>
          </dt>
          <dd lang="ja" className="font-jp font-medium">{circled(chip.number)}</dd>
        </dl>
        <Button variant={reviewed ? "outline" : "default"} onClick={toggle} className="w-full">
          {reviewed ? (
            <>
              <Check aria-hidden="true" /> <Trans>Reviewed · Undo</Trans>
            </>
          ) : (
            <Trans>Mark as reviewed</Trans>
          )}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
