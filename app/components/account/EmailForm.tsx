import { useLingui } from "@lingui/react/macro";
import { Form } from "react-router";
import { PasswordField } from "~/components/form/PasswordField";
import { Status } from "~/components/form/Status";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";
import { FormCard } from "./FormCard";
import { useSubmitting } from "./hooks/useSubmitting";
import type { AccountResult } from "./types";

/** Sets the email that a password reset link goes to. Accounts made before emails have none yet. */
export function EmailForm({ email, result }: { email: string | null; result?: AccountResult }) {
  const saving = useSubmitting("email");
  const { t } = useLingui();
  return (
    <FormCard
      title={t`Email address`}
      description={
        email
          ? t`We send a reset link here when you forget your password.`
          : t`None yet. Add one, and you can reset your password if you forget it.`
      }
    >
      {/* key: after a save, the field shows the saved email. */}
      <Form key={email ?? ""} method="post" className="flex flex-col gap-3">
        <input type="hidden" name="intent" value="email" />
        <input
          name="email"
          type="email"
          aria-label={t`Email address`}
          required
          maxLength={254}
          autoComplete="email"
          defaultValue={email ?? ""}
          aria-invalid={result?.error ? true : undefined}
          className={INPUT_CLASS}
        />
        <PasswordField label={t`Current password`} name="password" required autoComplete="current-password" />
        <Status error={result?.error} saved={result?.saved} />
        <Button type="submit" disabled={saving} className="self-end">
          {saving ? t`Saving…` : t`Save`}
        </Button>
      </Form>
    </FormCard>
  );
}
