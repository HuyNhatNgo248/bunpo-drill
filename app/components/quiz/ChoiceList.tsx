import { useLingui } from "@lingui/react/macro";
import { RadioGroup, RadioGroupCard } from "~/components/ui/radio-group";
import { cn } from "~/lib/utils";

/** The 4 choices of a fill-blank or passage question, shown as 1–4; `stacked` one per line, for sentence-long choices. */
export function ChoiceList({
  num,
  choices,
  picked,
  onPick,
  stacked = false,
}: {
  num: number;
  choices: string[];
  picked: number | null;
  onPick: (index: number) => void;
  stacked?: boolean;
}) {
  const { t } = useLingui();
  return (
    <RadioGroup
      aria-label={t`Choices for question ${num}`}
      value={picked === null ? "" : String(picked)}
      onValueChange={(value) => onPick(Number(value))}
      className={cn("grid-cols-1 gap-2 md:gap-2.5", !stacked && "md:grid-cols-2")}
    >
      {choices.map((choice, index) => (
        <RadioGroupCard key={index} value={String(index)} className={cn(stacked && "py-2.5")}>
          <span className="text-caption text-muted-foreground">{index + 1}</span>
          <span lang="ja" className={cn("font-jp text-base", stacked && "leading-relaxed")}>
            {choice}
          </span>
        </RadioGroupCard>
      ))}
    </RadioGroup>
  );
}
