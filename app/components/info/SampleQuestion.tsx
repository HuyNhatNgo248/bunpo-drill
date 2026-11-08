import type { MessageDescriptor } from "@lingui/core";
import { useLingui } from "@lingui/react/macro";
import { useState, type ReactNode } from "react";
import { ChoiceList } from "~/components/quiz/ChoiceList";
import { cn } from "~/lib/utils";

/**
 * An example question the visitor answers on the spot: its prompt, its 4 choices, then whether the pick is right and
 * why (`children` go under the reason). The pick can change; the verdict follows it. `onPick` tells the page that an
 * answer is in, for a passage that shows its proof then.
 */
export function SampleQuestion({
  prompt,
  choices,
  answer,
  why,
  stacked = false,
  onPick,
  children,
}: {
  prompt: ReactNode;
  choices: string[];
  /** Index of the right choice. */
  answer: number;
  why: MessageDescriptor;
  stacked?: boolean;
  onPick?: () => void;
  children?: ReactNode;
}) {
  const { t, i18n } = useLingui();
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked === answer;
  const no = answer + 1;
  return (
    <div className="flex min-w-0 flex-col gap-3.5 rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6.5 min-w-6.5 items-center justify-center rounded-lg bg-muted px-1.5 text-xs font-semibold text-secondary-foreground md:text-caption">
          1
        </span>
        <span className="text-caption text-subtle-foreground">{t`Sample`}</span>
      </div>
      <p lang="ja" className="font-jp text-lg leading-sentence md:text-xl">
        {prompt}
      </p>
      <ChoiceList
        num={1}
        choices={choices}
        picked={picked}
        stacked={stacked}
        onPick={(index) => {
          setPicked(index);
          onPick?.();
        }}
      />
      {picked === null ? (
        <p className="text-caption text-subtle-foreground">{t`Pick an answer to see why.`}</p>
      ) : (
        <div role="status" className="flex flex-col gap-1 rounded-box border bg-card p-3.5">
          <p className={cn("text-caption font-semibold", right ? "text-success" : "text-primary-soft-foreground")}>
            {right ? t`Correct` : t`The answer is ${no}`}
          </p>
          <p className="text-caption leading-sentence text-subtle-foreground">{i18n._(why)}</p>
          {children}
        </div>
      )}
    </div>
  );
}
