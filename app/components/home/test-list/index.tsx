import { useLingui } from "@lingui/react/macro";
import type { TestSummary } from "~/lib/views";
import { TestRow } from "./TestRow";

/**
 * The tests, grouped by what is next for each: the ones in progress, the ones not taken yet, and the taken ones.
 * The server sends them in that order, each group by title.
 */
export function TestList({ tests }: { tests: TestSummary[] }) {
  const { t } = useLingui();
  const groups = [
    { key: "in-progress", title: t`In progress`, tests: tests.filter((test) => !test.result && test.answered !== null) },
    { key: "not-taken", title: t`Not taken yet`, tests: tests.filter((test) => !test.result && test.answered === null) },
    { key: "taken", title: t`Taken`, tests: tests.filter((test) => test.result) },
  ];

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
                  <TestRow key={test.id} test={test} />
                ))}
              </ul>
            </section>
          ),
      )}
    </div>
  );
}
