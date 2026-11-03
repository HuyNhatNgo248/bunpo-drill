import { useLingui } from "@lingui/react/macro";
import { Fragment } from "react";
import { StatCard } from "~/components/StatCard";

/** The figures over all the tests of the level shown, not only its page, which the home loader works out. */
export type HomeStats = { average: number | null; toReview: number; taken: number; total: number };

const averageOf = (stats: HomeStats) => (stats.average === null ? "—" : `${stats.average}%`);

/** The average score, the grammar left to review, and how many of the level's tests are taken, as cards: on a computer. */
export function Stats({ stats }: { stats: HomeStats }) {
  const { t } = useLingui();
  return (
    <div className="hidden md:grid md:grid-cols-stats md:gap-3">
      <StatCard label={t`Average score`} value={averageOf(stats)} />
      <StatCard label={t`Grammar to review`} value={stats.toReview} />
      <StatCard
        label={t`Taken`}
        value={
          <>
            {stats.taken} <span className="text-sm font-normal text-muted-foreground">/ {stats.total}</span>
          </>
        }
      />
    </div>
  );
}

/** The same figures as one line under the page title: on a phone, which has no room for three cards. */
export function StatsLine({ stats }: { stats: HomeStats }) {
  const { t } = useLingui();
  const figures = [
    { label: t`Average`, value: averageOf(stats) },
    { label: t`To review`, value: stats.toReview },
    { label: t`Taken`, value: `${stats.taken} / ${stats.total}` },
  ];
  return (
    <p className="text-caption text-muted-foreground md:hidden">
      {figures.map(({ label, value }, i) => (
        <Fragment key={label}>
          {i > 0 && " · "}
          {label} <span className="font-semibold text-foreground tabular-nums">{value}</span>
        </Fragment>
      ))}
    </p>
  );
}
