import { Trans } from "@lingui/react/macro";
import { lazy, Suspense } from "react";
import { Card } from "~/components/ui/card";
import type { JlptLevel } from "~/lib/payload";

// Loaded only when a level shows it: the package's React entry brings all its figures, about 75 KB gzipped.
const Drawer = lazy(() => import("@lucasmarkes/hairline/react").then((m) => ({ default: m.Drawer })));

/**
 * What a level's tab shows when the app makes no mock tests for that level yet (N5, N4, N1): a cabinet whose drawers
 * slide out empty under the pointer (Hairline's Drawer). The heading says it all, so the drawing is hidden from screen readers.
 */
export function LevelUnavailable({ level }: { level: JlptLevel }) {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed border-input p-7 text-center">
      {/* The box holds the figure's 5:4 place while it loads, so the text below does not move. */}
      <Suspense fallback={<div aria-hidden="true" className="mb-1 aspect-5/4 w-48" />}>
        <Drawer aria-hidden="true" className="mb-1 w-48" />
      </Suspense>
      <h2 className="text-base font-semibold">
        <Trans>{level} isn't available yet</Trans>
      </h2>
      <p className="max-w-115 text-muted-foreground">
        <Trans>Mock tests for {level} are coming later.</Trans>
      </p>
    </Card>
  );
}
