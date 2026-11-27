import { useId } from "react";
import { Badge } from "~/components/ui/badge";
import type { Series } from "./helpers/seriesList";
import { TestTile } from "./TestTile";

/** A series: its name and how many of its tests are taken, over its tests as tiles, ten to a line (five on a phone). */
export function SeriesBoard({ series, isAdmin = false }: { series: Series; isAdmin?: boolean }) {
  const id = useId();
  const taken = series.tests.filter(({ test }) => test.result).length;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <h3 id={id} className="flex items-center gap-2 text-caption font-semibold text-subtle-foreground">
        {series.name}{" "}
        <Badge variant="count">
          {taken} / {series.tests.length}
        </Badge>
      </h3>
      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {series.tests.map(({ test, number }) => (
          <li key={test.id}>
            <TestTile test={test} number={number} isAdmin={isAdmin} />
          </li>
        ))}
      </ul>
    </section>
  );
}
