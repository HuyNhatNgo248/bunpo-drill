import { useLingui } from "@lingui/react/macro";
import { useSubmit } from "react-router";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Button } from "~/components/ui/button";

/** Takes a test again, after asking: a retake clears the last answers and keeps only their score. */
export function RetakeButton({
  testId,
  wrongOnly = false,
  ...button
}: { testId: string; wrongOnly?: boolean } & React.ComponentProps<typeof Button>) {
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
    >
      <Button {...button} />
    </ConfirmDialog>
  );
}
