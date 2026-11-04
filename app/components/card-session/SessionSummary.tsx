import { Plural, Trans } from "@lingui/react/macro";

/** The heading of a finished session: how many cards, how many were got right the first time and how many needed Again. */
export function SessionSummary({ total, gotIt, again }: { total: number; gotIt: number; again: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h2 className="text-xl font-bold tracking-tight">
        <Trans>Session done</Trans>
      </h2>
      <p className="text-caption text-muted-foreground">
        <Plural value={total} one="# card" other="# cards" />
        {" · "}
        <Trans>{gotIt} got it first time</Trans>
        {" · "}
        <Trans>{again} needed again</Trans>
      </p>
    </div>
  );
}
