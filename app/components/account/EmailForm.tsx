import { Trans, useLingui } from "@lingui/react/macro";
import { Form } from "react-router";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useSubmitting } from "./hooks/useSubmitting";
import { Status } from "./Status";
import type { AccountResult } from "./types";

/** Sets the email that a password reset link goes to. Accounts made before emails have none yet. */
export function EmailForm({ email, result }: { email: string | null; result?: AccountResult }) {
  const saving = useSubmitting("email");
  const { t } = useLingui();
  return (
    <Card className="flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">
          <Trans>Email address</Trans>
        </h2>
        <p className="text-caption text-muted-foreground">
          {email
            ? t`We send a reset link here when you forget your password.`
            : t`None yet. Add one, and you can reset your password if you forget it.`}
        </p>
      </div>
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
        <Status result={result} />
        <Button type="submit" disabled={saving} className="self-end">
          {saving ? t`Saving…` : t`Save`}
        </Button>
      </Form>
    </Card>
  );
}
