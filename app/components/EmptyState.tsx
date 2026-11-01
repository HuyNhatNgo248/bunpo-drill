import { lazy, Suspense, type ReactNode } from "react";
import { Card } from "~/components/ui/card";
import { loadDrawerFigure } from "./helpers/drawerFigure";

const Drawer = lazy(() => loadDrawerFigure().then((m) => ({ default: m.Drawer })));

/**
 * A dashed card that says a list is empty, and why. `drawer`: above it, a cabinet whose drawers slide out empty under
 * the pointer (Hairline's Drawer), for a level the app has nothing for yet. The heading says it all, so the drawing is
 * hidden from screen readers.
 */
export function EmptyState({ title, children, drawer = false }: { title: ReactNode; children: ReactNode; drawer?: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed border-input p-7 text-center">
      {drawer && (
        // The box holds the figure's 5:4 place while it loads, so the text below does not move.
        <Suspense fallback={<div aria-hidden="true" className="mb-1 aspect-5/4 w-48" />}>
          <Drawer aria-hidden="true" className="mb-1 w-48" />
        </Suspense>
      )}
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-115 text-muted-foreground">{children}</p>
    </Card>
  );
}
