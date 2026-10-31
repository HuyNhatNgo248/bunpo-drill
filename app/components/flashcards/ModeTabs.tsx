import { useLingui } from "@lingui/react/macro";
import { SECTION_TITLES } from "~/lib/sections";
import { cn } from "~/lib/utils";

/** Which side a card shows first: the word, to read (漢字読み), or its reading, to write in kanji (表記). */
export type CardMode = "kanji-reading" | "kanji-writing";

const MODES: CardMode[] = ["kanji-reading", "kanji-writing"];

/** Switches the cards between the exam's two kanji 問題, named as the exam names them. */
export function ModeTabs({ mode, onChange }: { mode: CardMode; onChange: (mode: CardMode) => void }) {
  const { t } = useLingui();
  return (
    <div role="group" aria-label={t`Card side`} className="rounded-lg border bg-card p-1">
      <div lang="ja" className="grid grid-cols-2">
        {MODES.map((each) => (
          <button
            key={each}
            type="button"
            aria-pressed={each === mode}
            onClick={() => onChange(each)}
            className={cn(
              "h-8 rounded-md px-3.5 font-jp text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
              each === mode ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {SECTION_TITLES[each]}
          </button>
        ))}
      </div>
    </div>
  );
}
