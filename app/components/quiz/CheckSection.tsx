import { Plural, useLingui } from "@lingui/react/macro";
import { useEffect } from "react";
import { useFetcher } from "react-router";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Status } from "~/components/form/Status";
import { Button } from "~/components/ui/button";
import type { Answers, ResultSection } from "~/lib/views";

/**
 * The button under a part that grades it on the server (POST to `action`, /tests/:id/check). It asks first, since a
 * checked part shows its right answers and its own answers can't change after.
 */
export function CheckSection({
  action,
  no,
  answers,
  unanswered,
  onChecked,
}: {
  action: string;
  no: number;
  /** The answers to this part's questions. */
  answers: Answers;
  unanswered: number;
  onChecked: (section: ResultSection) => void;
}) {
  const { t } = useLingui();
  const fetcher = useFetcher<{ section: ResultSection } | { error: string }>();
  const checking = fetcher.state !== "idle";
  const result = fetcher.data;

  useEffect(() => {
    if (result && "section" in result) onChecked(result.section);
  }, [result, onChecked]);

  const check = () =>
    fetcher.submit({ section: no, answers }, { method: "post", action, encType: "application/json" });

  return (
    <div className="flex flex-col items-end gap-2">
      <Status error={result && "error" in result ? result.error : undefined} />
      <ConfirmDialog
        title={
          unanswered > 0 ? (
            <Plural
              value={unanswered}
              one="# question in this part is unanswered. Check anyway?"
              other="# questions in this part are unanswered. Check anyway?"
            />
          ) : (
            t`Check Part ${no}?`
          )
        }
        description={t`You'll see the right answers, and this part's answers can't be changed after.`}
        confirmLabel={t`Check`}
        cancelLabel={t`Keep answering`}
        onConfirm={check}
      >
        <Button variant="outline" disabled={checking} className="text-secondary-foreground">
          {checking ? t`Checking…` : t`Check Part ${no}`}
        </Button>
      </ConfirmDialog>
    </div>
  );
}
