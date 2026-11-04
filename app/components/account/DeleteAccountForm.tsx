import { useLingui } from "@lingui/react/macro";
import { useRef } from "react";
import { Form } from "react-router";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { PasswordField } from "~/components/form/PasswordField";
import { Status } from "~/components/form/Status";
import { Button } from "~/components/ui/button";
import { FormCard } from "./FormCard";
import { useSubmitting } from "./hooks/useSubmitting";
import type { AccountResult } from "./types";

/** Deletes the account for good. The password is needed, and the button asks first. */
export function DeleteAccountForm({ result }: { result?: AccountResult }) {
  const deleting = useSubmitting("delete");
  const { t } = useLingui();
  const form = useRef<HTMLFormElement>(null);
  const warning = t`Your results, drafts, review marks, learned words and notes are deleted with it. This can't be undone.`;

  return (
    <FormCard title={t`Delete account`} description={<span className="leading-sentence">{warning}</span>}>
      <Form ref={form} method="post" className="flex flex-col gap-3">
        <input type="hidden" name="intent" value="delete" />
        <PasswordField label={t`Password`} name="password" required autoComplete="current-password" />
        <Status error={result?.error} />
        {/* requestSubmit, so an empty password is caught by the field before anything is sent. */}
        <ConfirmDialog
          title={t`Delete your account?`}
          description={warning}
          confirmLabel={t`Delete account`}
          onConfirm={() => form.current?.requestSubmit()}
        >
          <Button type="button" variant="destructive" disabled={deleting} className="self-end">
            {deleting ? t`Deleting…` : t`Delete account`}
          </Button>
        </ConfirmDialog>
      </Form>
    </FormCard>
  );
}
