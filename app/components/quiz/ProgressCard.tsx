import { Trans, useLingui } from "@lingui/react/macro";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

/** Desktop: the answered count and its bar, pinned near the top while the questions scroll. */
export function ProgressCard({ answered, total, percent }: { answered: number; total: number; percent: number }) {
  const { t } = useLingui();
  return (
    // h-18 at top-3 ends 84px down; the question list and passages stick at top-24 (96px), just below it.
    <Card className="sticky top-3 z-10 hidden h-18 flex-col justify-center gap-2.5 px-5 shadow-raised md:flex">
      <span className="text-caption font-medium">
        <Trans>
          Answered {answered} / {total}
        </Trans>
      </span>
      <Progress value={percent} minFill={1} aria-label={t`Answered`} className="h-2" />
    </Card>
  );
}
