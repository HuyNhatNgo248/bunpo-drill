import { Trans, useLingui } from "@lingui/react/macro";
import { Form, useNavigation } from "react-router";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";

/** The email field. The error of the last try shows above the button. */
export function ForgotPasswordForm({ error }: { error?: string }) {
  const { t } = useLingui();
  const sending = useNavigation().state !== "idle";
  return (
    <Form method="post" className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-caption font-medium">
          <Trans>Email address</Trans>
        </span>
        <input
          name="email"
          type="email"
          required
          autoFocus
          maxLength={254}
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "forgot-error" : undefined}
          className={INPUT_CLASS}
        />
      </label>
      {error && (
        <p id="forgot-error" role="alert" className="text-caption text-primary-soft-foreground">
          {error}
        </p>
      )}
      <Button type="submit" disabled={sending}>
        {sending ? t`Sending…` : t`Send the link`}
      </Button>
    </Form>
  );
}
