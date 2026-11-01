import { useLingui } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { hasSavedAnswers, savedAnsweredCount } from "~/components/quiz/helpers/savedAnswers";
import type { TestSummary } from "~/lib/views";
import { TestRow } from "./TestRow";

/**
 * The tests of a page, grouped by what is next for each: the ones left half done, the ones not taken yet, and the
 * taken ones. The server sends them in title order, the taken ones last, and each group keeps that order.
 */
export function TestList({ tests }: { tests: TestSummary[] }) {
  const { t } = useLingui();
  // How far each test left before submitting got: its answers are saved in this browser, so the server cannot know,
  // and they are read after hydration. Until then such a test shows as not taken.
  const [answered, setAnswered] = useState<Map<string, number>>(new Map());
  useEffect(
    () => setAnswered(new Map(tests.filter((test) => hasSavedAnswers(test.id)).map((test) => [test.id, savedAnsweredCount(test.id)]))),
    [tests],
  );
  const groups = [
    { key: "in-progress", title: t`In progress`, tests: tests.filter((test) => !test.result && answered.has(test.id)) },
    { key: "not-taken", title: t`Not taken yet`, tests: tests.filter((test) => !test.result && !answered.has(test.id)) },
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
                  <TestRow key={test.id} test={test} answered={answered.get(test.id) ?? null} />
                ))}
              </ul>
            </section>
          ),
      )}
    </div>
  );
}
