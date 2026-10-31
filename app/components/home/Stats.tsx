import { useLingui } from "@lingui/react/macro";
import { StatCard } from "./StatCard";

/** The figures over all the tests of the level shown, not only its page, which the home loader works out. */
export type HomeStats = { average: number | null; toReview: number; taken: number; total: number };

/** The average score, the grammar left to review, and how many of the level's tests are taken. */
export function Stats({ stats }: { stats: HomeStats }) {
  const { t } = useLingui();
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-stats md:gap-3">
      <StatCard label={t`Average score`} value={stats.average === null ? "—" : `${stats.average}%`} />
      <StatCard label={t`Grammar to review`} value={stats.toReview} />
      <StatCard
        label={t`Taken`}
        value={
          <>
            {stats.taken}{" "}
            <span className="text-caption font-normal text-muted-foreground md:text-sm">/ {stats.total}</span>
          </>
        }
      />
    </div>
  );
}
