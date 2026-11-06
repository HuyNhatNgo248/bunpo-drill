import { Trans, useLingui } from "@lingui/react/macro";
import { useSearchParams } from "react-router";
import { EmptyState } from "~/components/EmptyState";
import { Rail } from "~/components/Rail";
import { Badge } from "~/components/ui/badge";
import { READING_GROUP_TITLES } from "~/lib/sections";
import { clock, cn } from "~/lib/utils";
import type { ReadingGroup } from "~/lib/views";
import { SetRow } from "./SetRow";

/**
 * The groups to pick from, like the kanji chapters, then the group picked: what its taken sets missed most, then its
 * sets to do and its sets done. The group is in the address (`group`); without one, or one that isn't there, it is the
 * first with a set not taken yet.
 */
export function GroupList({ groups, isAdmin = false }: { groups: ReadingGroup[]; isAdmin?: boolean }) {
  const { t } = useLingui();
  const [params] = useSearchParams();
  const picked = Number(params.get("group"));
  const shown =
    groups.find(({ value }) => value === picked) ??
    groups.find(({ sets }) => sets.some((set) => !set.result)) ??
    groups.find(({ sets }) => sets.length) ??
    groups[0]!;
  const title = READING_GROUP_TITLES[shown.type];
  const taken = shown.sets.filter((set) => set.result).length;
  const total = shown.sets.length;
  const toDo = shown.sets.filter((set) => !set.result);
  const done = shown.sets.filter((set) => set.result);

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
      <Rail
        label={t`Reading types`}
        param="group"
        numbered
        current={shown.value}
        items={groups.map((group) => ({
          value: group.value,
          label: (
            <span lang="ja" className="font-jp">
              {READING_GROUP_TITLES[group.type]}
            </span>
          ),
          done: group.sets.filter((set) => set.result).length,
          total: group.sets.length,
        }))}
      />
      <section aria-labelledby="reading-group" className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="reading-group" lang="ja" className="font-jp text-xl font-bold md:text-2xl">
            {title}
          </h2>
          <span className="text-caption text-muted-foreground tabular-nums">
            <Trans>
              {taken} / {total} done
            </Trans>
            {shown.pace && <Pace {...shown.pace} />}
          </span>
        </div>

        {shown.missed.length > 0 && (
          <section aria-labelledby="reading-missed" className="flex flex-col gap-2.5">
            <h3 id="reading-missed" className="flex items-center gap-2 text-caption font-semibold text-subtle-foreground">
              {t`Question kinds to work on`} <Badge variant="count">{shown.missed.length}</Badge>
            </h3>
            <ul className="flex flex-wrap gap-2">
              {shown.missed.map(({ kind, count }) => (
                <li key={kind} className="flex items-center gap-2 rounded-lg border border-primary-border bg-primary-soft px-3 py-1.5 text-primary-soft-foreground">
                  <span lang="ja" className="font-jp font-medium">
                    {kind}
                  </span>
                  <span className="text-xs font-semibold tabular-nums">
                    <Trans>{count} missed</Trans>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {total === 0 && (
          <EmptyState title={<Trans>No {title} sets yet</Trans>}>
            <Trans>A set shows up here once Claude sends one, with /jlpt-reading-quiz {title}.</Trans>
          </EmptyState>
        )}
        <SetGroup id="reading-to-do" title={t`To do`} sets={toDo} isAdmin={isAdmin} />
        <SetGroup id="reading-done" title={t`Done`} sets={done} isAdmin={isAdmin} />
      </section>
    </div>
  );
}

/** " · 3:47 a passage, target 2:00", the time in amber when it is over the target. */
function Pace({ seconds, target }: { seconds: number; target: number }) {
  const time = clock(seconds);
  const goal = clock(target);
  return (
    <>
      {" · "}
      <span className={cn(seconds > target && "text-warning")}>
        <Trans>{time} a passage</Trans>
      </span>
      {", "}
      <Trans>target {goal}</Trans>
    </>
  );
}

function SetGroup({ id, title, sets, isAdmin }: { id: string; title: string; sets: ReadingGroup["sets"]; isAdmin: boolean }) {
  if (!sets.length) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <h3 id={id} className="flex items-center gap-2 text-caption font-semibold text-subtle-foreground">
        {title} <Badge variant="count">{sets.length}</Badge>
      </h3>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {sets.map((set) => (
          <SetRow key={set.id} set={set} isAdmin={isAdmin} />
        ))}
      </ul>
    </section>
  );
}
