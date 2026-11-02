import { useLingui } from "@lingui/react/macro";
import { useSubmit } from "react-router";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Button } from "~/components/ui/button";

type Retake = { testId: string; wrongOnly?: boolean };

/** Asks before a retake, which clears the last answers. Opened by its `children`, or by `open`. */
export function RetakeDialog({
  testId,
  wrongOnly = false,
  ...dialog
}: Retake & { children?: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const { t } = useLingui();
  const submit = useSubmit();
  return (
    <ConfirmDialog
      title={t`Did you review your weak grammar?`}
      description={
        wrongOnly
          ? t`Make sure you study the grammar you got wrong first. The quiz asks only the ones you got wrong.`
          : t`Make sure you study the grammar you got wrong first.`
      }
      confirmLabel={t`Yes, retake`}
      cancelLabel={t`Not yet`}
      onConfirm={() => submit(null, { method: "post", action: `/tests/${testId}/retake${wrongOnly ? "?only=wrong" : ""}` })}
      {...dialog}
    />
  );
}

/** Takes a test again, after asking. */
export function RetakeButton({ testId, wrongOnly, ...button }: Retake & React.ComponentProps<typeof Button>) {
  return (
    <RetakeDialog testId={testId} wrongOnly={wrongOnly}>
      <Button {...button} />
    </RetakeDialog>
  );
}
