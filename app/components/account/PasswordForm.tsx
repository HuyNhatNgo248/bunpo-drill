import { useLingui } from "@lingui/react/macro";
import { useEffect, useRef } from "react";
import { Form } from "react-router";
import { PasswordField } from "~/components/form/PasswordField";
import { Status } from "~/components/form/Status";
import { Button } from "~/components/ui/button";
import { FormCard } from "./FormCard";
import { useSubmitting } from "./hooks/useSubmitting";
import type { AccountResult } from "./types";

/** Changes the password. The current password is needed, and the fields empty after a change. */
export function PasswordForm({ result }: { result?: AccountResult }) {
  const saving = useSubmitting("password");
  const { t } = useLingui();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result?.saved) form.current?.reset();
  }, [result]);

  return (
    <FormCard title={t`Password`}>
      <Form ref={form} method="post" className="flex flex-col gap-3">
        <input type="hidden" name="intent" value="password" />
        <PasswordField label={t`Current password`} name="current" required autoComplete="current-password" />
        <PasswordField label={t`New password`} hint={t`At least 8 characters`} name="next" required minLength={8} autoComplete="new-password" />
        <Status error={result?.error} saved={result?.saved} />
        <Button type="submit" disabled={saving} className="self-end">
          {saving ? t`Changing…` : t`Change password`}
        </Button>
      </Form>
    </FormCard>
  );
}
