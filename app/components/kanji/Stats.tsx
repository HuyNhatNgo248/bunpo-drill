import { useLingui } from "@lingui/react/macro";
import { StatCard } from "~/components/StatCard";
import type { KanjiHomeView } from "~/lib/views";

/** The words learned, the average of the chapters' newest quizzes, and the missed words not learned since. */
export function Stats({ stats }: { stats: KanjiHomeView["stats"] }) {
  const { t } = useLingui();
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-stats md:gap-3">
      <StatCard
        label={t`Words learned`}
        value={
          <>
            {stats.learned}{" "}
            <span className="text-caption font-normal text-muted-foreground md:text-sm">/ {stats.words}</span>
          </>
        }
      />
      <StatCard label={t`Quiz average`} value={stats.average === null ? "—" : `${stats.average}%`} />
      <StatCard label={t`Missed words`} value={stats.missed} />
    </div>
  );
}
