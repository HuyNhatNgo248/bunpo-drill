import { Trans } from "@lingui/react/macro";
import { Card } from "~/components/ui/card";

/** What the home page shows before Claude has made a test. */
export function EmptyState() {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed border-input p-7 text-center">
      <h2 className="text-base font-semibold">
        <Trans>No mock tests yet</Trans>
      </h2>
      <p className="max-w-115 text-muted-foreground">
        <Trans>New mock tests show up here.</Trans>
      </p>
    </Card>
  );
}
