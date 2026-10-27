import { RadioGroup, RadioGroupCard } from "~/components/ui/radio-group";

/** The 4 choices of a fill-blank or passage question, shown as 1–4. */
export function ChoiceList({
  num,
  choices,
  picked,
  onPick,
}: {
  num: number;
  choices: string[];
  picked: number | null;
  onPick: (index: number) => void;
}) {
  return (
    <RadioGroup
      aria-label={`問題 ${num} の選択肢`}
      value={picked === null ? "" : String(picked)}
      onValueChange={(value) => onPick(Number(value))}
      className="grid-cols-1 gap-2 md:grid-cols-2 md:gap-2.5"
    >
      {choices.map((choice, index) => (
        <RadioGroupCard key={index} value={String(index)}>
          <span className="text-[13px] text-muted-foreground">{index + 1}</span>
          <span lang="ja" className="font-jp text-base">
            {choice}
          </span>
        </RadioGroupCard>
      ))}
    </RadioGroup>
  );
}
