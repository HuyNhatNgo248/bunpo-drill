import { Trans } from "@lingui/react/macro";
import { Card } from "~/components/ui/card";
import type { JlptLevel } from "~/lib/payload";
import { EmptyTrays } from "./EmptyTrays";

/** What a level's tab shows when the app makes no mock tests for that level yet (N5, N4, N1). */
export function LevelUnavailable({ level }: { level: JlptLevel }) {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed border-input p-7 text-center">
      <EmptyTrays className="mb-2 w-40" />
      <h2 className="text-base font-semibold">
        <Trans>{level} isn't available yet</Trans>
      </h2>
      <p className="max-w-115 text-muted-foreground">
        <Trans>Mock tests for {level} are coming later.</Trans>
      </p>
    </Card>
  );
}
