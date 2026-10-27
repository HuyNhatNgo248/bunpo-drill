import { AppHeader } from "~/components/layout/header";
import { Progress } from "~/components/ui/progress";

/** Mobile: the header with the answered count, and a progress bar under it, both pinned to the top. */
export function Header({
  title,
  answered,
  total,
  percent,
}: {
  title: string;
  answered: number;
  total: number;
  percent: number;
}) {
  return (
    <div className="sticky top-0 z-20 md:static">
      <AppHeader
        back
        mobileTitle={title}
        mobileAside={
          <span className="pr-2 text-[13px] text-subtle-foreground">
            {answered} / {total}
          </span>
        }
      />
      <Progress value={percent} minFill={1} aria-label="回答済み" className="rounded-none md:hidden" />
    </div>
  );
}
