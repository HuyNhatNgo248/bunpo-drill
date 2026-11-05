import { useLingui } from "@lingui/react/macro";
import { SECTION_TITLES } from "~/lib/sections";
import { cn } from "~/lib/utils";

/** Which side a card shows first: the word, to read (漢字読み), or its reading, to write in kanji (表記). */
export type CardMode = "kanji-reading" | "kanji-writing";

const MODES: CardMode[] = ["kanji-reading", "kanji-writing"];

/** The mode kept between visits. */
const KEY = "flashcard-mode";

export function savedMode(): CardMode {
  try {
    const saved = localStorage.getItem(KEY);
    return MODES.find((mode) => mode === saved) ?? "kanji-reading";
  } catch {
    return "kanji-reading"; // storage blocked: the first mode
  }
}

export function saveMode(mode: CardMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // Not kept; the switch still works for this visit.
  }
}

/** Switches the cards between the exam's two kanji 問題, named as the exam names them. */
export function ModeTabs({ mode, onChange }: { mode: CardMode; onChange: (mode: CardMode) => void }) {
  const { t } = useLingui();
  const asks = { "kanji-reading": t`Word → reading`, "kanji-writing": t`Reading → word` };
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
              "flex h-11 flex-col items-center justify-center rounded-md px-3.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
              each === mode ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="font-jp text-sm font-semibold">{SECTION_TITLES[each]}</span>
            <span className="text-xs">{asks[each]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
