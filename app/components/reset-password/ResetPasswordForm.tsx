import { useLingui } from "@lingui/react/macro";
import { Form, useNavigation } from "react-router";
import { PasswordField } from "~/components/form/PasswordField";
import { Status } from "~/components/form/Status";
import { Button } from "~/components/ui/button";

/** The new password, sent with the token of the link. The error of the last try shows above the button. */
export function ResetPasswordForm({ token, error }: { token: string; error?: string }) {
  const { t } = useLingui();
  const saving = useNavigation().state !== "idle";
  return (
    <Form method="post" className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <PasswordField
        label={t`New password`}
        hint={t`At least 8 characters`}
        name="password"
        required
        autoFocus
        minLength={8}
        autoComplete="new-password"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "reset-error" : undefined}
      />
      <Status id="reset-error" error={error} />
      <Button type="submit" disabled={saving}>
        {saving ? t`Changing…` : t`Change password`}
      </Button>
    </Form>
  );
}
