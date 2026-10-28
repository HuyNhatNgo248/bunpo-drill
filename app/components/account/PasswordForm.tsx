import { Trans, useLingui } from "@lingui/react/macro";
import { useEffect, useRef } from "react";
import { Form } from "react-router";
import { PasswordField } from "~/components/form/PasswordField";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useSubmitting } from "./hooks/useSubmitting";
import { Status } from "./Status";
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
    <Card className="flex flex-col gap-4 p-5 md:p-6">
      <h2 className="text-base font-semibold">
        <Trans>Password</Trans>
      </h2>
      <Form ref={form} method="post" className="flex flex-col gap-3">
        <input type="hidden" name="intent" value="password" />
        <PasswordField label={t`Current password`} name="current" required autoComplete="current-password" className={INPUT_CLASS} />
        <PasswordField
          label={t`New password`}
          hint={t`At least 8 characters`}
          name="next"
          required
          minLength={8}
          autoComplete="new-password"
          className={INPUT_CLASS}
        />
        <Status result={result} />
        <Button type="submit" disabled={saving} className="self-end">
          {saving ? t`Changing…` : t`Change password`}
        </Button>
      </Form>
    </Card>
  );
}
