import { Trans, useLingui } from "@lingui/react/macro";
import { EmptyState } from "~/components/EmptyState";
import { Button } from "~/components/ui/button";
import type { TestSummary } from "~/lib/views";
import { matchOf } from "../helpers/searchTests";
import { TestRow } from "./TestRow";

/**
 * The tests that match the search `query` (all of them when it is empty), grouped by what is next for each: the ones
 * in progress, the ones not taken yet, and the taken ones. The server sends them in that order, each group by title.
 * A test found by its grammar says which; when none match, a message offers to clear the search.
 */
export function TestList({ tests, query = "", onClear }: { tests: TestSummary[]; query?: string; onClear?: () => void }) {
  const { t } = useLingui();
  const matches = new Map(tests.flatMap((test) => {
    const matched = matchOf(test, query);
    return matched ? [[test.id, matched] as const] : [];
  }));
  const shown = tests.filter((test) => matches.has(test.id));
  const groups = [
    { key: "in-progress", title: t`In progress`, tests: shown.filter((test) => !test.result && test.answered !== null) },
    { key: "not-taken", title: t`Not taken yet`, tests: shown.filter((test) => !test.result && test.answered === null) },
    { key: "taken", title: t`Taken`, tests: shown.filter((test) => test.result) },
  ];

  if (shown.length === 0) {
    return (
      <EmptyState title={<Trans>No tests match “{query}”</Trans>}>
        <Button variant="outline" size="sm" className="mt-1" onClick={onClear}>
          <Trans>Clear the search</Trans>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {groups.map(
        (group) =>
          group.tests.length > 0 && (
            <section key={group.key} aria-labelledby={`tests-${group.key}`} className="flex flex-col gap-2.5 md:gap-3">
              <h2 id={`tests-${group.key}`} className="text-caption font-semibold text-muted-foreground">
                {group.title}
              </h2>
              <ul className="flex flex-col gap-4 md:gap-0 md:overflow-hidden md:rounded-xl md:border md:bg-card">
                {group.tests.map((test) => (
                  <TestRow key={test.id} test={test} matched={matches.get(test.id)} />
                ))}
              </ul>
            </section>
          ),
      )}
    </div>
  );
}
