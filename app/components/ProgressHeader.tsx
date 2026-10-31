import { AppHeader } from "~/components/layout/header";
import { Progress } from "~/components/ui/progress";

/** Mobile: the header with a count (answered, cards done), and a progress bar under it, both pinned to the top. */
export function ProgressHeader({
  title,
  count,
  percent,
  label,
  back,
}: {
  title: string;
  count: string;
  percent: number;
  /** What the bar measures, for a screen reader: "Answered". */
  label: string;
  back?: { to: string; label: string };
}) {
  return (
    <div className="sticky top-0 z-20 md:static">
      <AppHeader mobileTitle={title} back={back} mobileAside={<span className="pr-2 text-caption text-subtle-foreground">{count}</span>} />
      <Progress value={percent} minFill={1} aria-label={label} className="rounded-none md:hidden" />
    </div>
  );
}
