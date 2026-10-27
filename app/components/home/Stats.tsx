import { StatCard } from "./StatCard";

/** The figures over all tests that the home loader works out. */
export type HomeStats = { average: number | null; toReview: number; taken: number };

/** The average score, the grammar left to review, and how many of the `total` tests are taken. */
export function Stats({ stats, total }: { stats: HomeStats; total: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-stats md:gap-3">
      <StatCard label="平均正答率" value={stats.average === null ? "—" : `${stats.average}%`} />
      <StatCard label="要復習の文法" value={stats.toReview} />
      <StatCard
        label="受験済み"
        value={
          <>
            {stats.taken}{" "}
            <span className="text-caption font-normal text-muted-foreground md:text-sm">/ {total}</span>
          </>
        }
      />
    </div>
  );
}
