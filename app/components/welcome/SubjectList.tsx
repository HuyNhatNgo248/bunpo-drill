import { useLingui } from "@lingui/react/macro";
import { BookOpenText, ClipboardCheck, PenLine } from "lucide-react";
import { Tabs } from "radix-ui";
import { TabHighlight } from "~/components/TabHighlight";
import { cn } from "~/lib/utils";
import type { TestKind } from "~/lib/views";

export const SUBJECTS: TestKind[] = ["grammar", "kanji", "reading"];

const ICONS = { grammar: ClipboardCheck, kanji: PenLine, reading: BookOpenText };

/**
 * The subject tabs of a welcome section, styled as the signed-in home's segmented control, the highlight sliding to the
 * one picked. Goes inside a Tabs.Root whose values are the subjects; `onPick` is its onValueChange.
 */
export function SubjectList({ subjects, value, onPick }: { subjects: TestKind[]; value: string; onPick: (kind: string) => void }) {
  const { t } = useLingui();
  const labels = { grammar: t`Grammar`, kanji: t`Kanji`, reading: t`Reading` };
  return (
    <Tabs.List aria-label={t`Subject`} className="self-start rounded-xl border bg-muted p-1">
      <div className="relative grid auto-cols-fr grid-flow-col">
        <TabHighlight index={subjects.indexOf(value as TestKind)} count={subjects.length} className="rounded-lg bg-card shadow-piece" />
        {subjects.map((kind) => {
          const Icon = ICONS[kind];
          return (
            <Tabs.Trigger
              key={kind}
              value={kind}
              // Radix focuses a tab from script on mouse-down, which Chrome shows with the keyboard focus ring. So a click
              // doesn't focus the tab (skipping Radix's handler) and picks it on click; the keyboard still works as before.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(kind)}
              className={cn(
                "flex h-8.5 items-center justify-center rounded-lg px-5 text-base font-semibold whitespace-nowrap outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/40",
                kind === value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {/* Over the sliding highlight. */}
              <span className="relative flex items-center gap-2">
                <Icon aria-hidden="true" className="size-4" />
                {labels[kind]}
              </span>
            </Tabs.Trigger>
          );
        })}
      </div>
    </Tabs.List>
  );
}
