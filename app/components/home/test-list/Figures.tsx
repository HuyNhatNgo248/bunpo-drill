import { useLingui } from "@lingui/react/macro";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { TestSummary } from "~/lib/views";

/** How a level's tests went: how many are taken, their average, and the best score; a dash before any is taken. */
export function Figures({ tests, className }: { tests: TestSummary[]; className?: string }) {
  const { t } = useLingui();
  const results = tests.flatMap((test) => (test.result ? [test.result] : []));
  const average = results.length > 0 ? Math.round(results.reduce((sum, result) => sum + result.percent, 0) / results.length) : null;
  const best = results.reduce<(typeof results)[number] | null>((top, result) => (!top || result.percent > top.percent ? result : top), null);
  const figures = [
    { label: t`Taken`, value: `${results.length} / ${tests.length}` },
    { label: t`Average`, value: average === null ? "—" : `${average}%` },
    { label: t`Best`, value: best ? `${best.score} / ${best.total}` : "—" },
  ];
  return (
    <Card className={cn("py-4", className)}>
      <dl className="grid h-full grid-cols-3 divide-x">
        {figures.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center justify-center gap-1.5 px-3">
            <dt className="text-caption text-muted-foreground">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
