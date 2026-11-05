import { Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { Check } from "lucide-react";
import { useFetchers, useSubmit } from "react-router";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { circled, dayLabel, weekLabel } from "~/lib/sections";
import type { ReviewChip } from "~/lib/views";

/** A test that got a grammar point wrong, by the point's id in that test. */
export type ReviewTarget = { testId: string; grammarId: string };

const keyOf = ({ testId, grammarId }: ReviewTarget) => `review:${testId}:${grammarId}`;

/**
 * One chip: tapping it opens where the point is in the 文法ノート, and a button that marks it reviewed in each of
 * `targets` (one test on its results, every test that got it wrong on the home page); with none, no button.
 */
export function GrammarChip({ chip, targets }: { chip: ReviewChip; targets: ReviewTarget[] }) {
  const { t, i18n } = useLingui();
  const submit = useSubmit();
  const keys = targets.map(keyOf);
  const pending = useFetchers().find((fetcher) => keys.includes(fetcher.key))?.json as { reviewed: boolean } | undefined;
  const reviewed = pending ? pending.reviewed : chip.reviewed;
  const toggle = () => {
    // A fetcher per test, so the marks don't cancel one another.
    for (const target of targets) {
      void submit(
        { grammarId: target.grammarId, reviewed: !reviewed },
        { method: "patch", action: `/api/tests/${target.testId}`, encType: "application/json", navigate: false, fetcherKey: keyOf(target) },
      );
    }
  };

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
        {targets.length > 0 && (
          <Button
            variant="outline"
            onClick={toggle}
            className={cn("w-full", reviewed && "border-success-border bg-success-soft text-success hover:bg-success-soft")}
          >
            <Check aria-hidden="true" />
            {reviewed ? <Trans>Reviewed · Undo</Trans> : <Trans>Mark as reviewed</Trans>}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
