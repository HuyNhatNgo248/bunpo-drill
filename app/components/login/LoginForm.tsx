import { Trans, useLingui } from "@lingui/react/macro";
import { Form, useNavigation } from "react-router";
import { PasswordField } from "~/components/form/PasswordField";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";

/**
 * The username (or, to sign in, the email) and password fields; on sign-up also the email (where a password reset goes).
 * The error of the last try shows above the button.
 */
export function LoginForm({ signup, redirectTo, error }: { signup: boolean; redirectTo: string; error?: string }) {
  const { t } = useLingui();
  const pending = useNavigation().state !== "idle";
  const invalid = error ? true : undefined;
  const describedBy = error ? "login-error" : undefined;

  return (
    <Form method="post" className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="flex flex-col gap-1.5">
        <span className="text-caption font-medium">{signup ? t`Username` : t`Username or email address`}</span>
        <input
          name="name"
          required
          autoFocus
          maxLength={signup ? 30 : 254}
          autoComplete="username"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={INPUT_CLASS}
        />
      </label>
      {signup && (
        // The hint stays outside the label, so a screen reader reads the field's name alone.
        <div className="flex flex-col gap-1.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-caption font-medium">
              <Trans>Email address</Trans>
            </span>
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={INPUT_CLASS}
            />
          </label>
          <span className="text-xs text-muted-foreground">
            <Trans>We send a reset link here when you forget your password.</Trans>
          </span>
        </div>
      )}
      <PasswordField
        label={t`Password`}
        hint={signup ? t`At least 8 characters` : undefined}
        name="password"
        required
        minLength={signup ? 8 : undefined}
        autoComplete={signup ? "new-password" : "current-password"}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={INPUT_CLASS}
      />
      {error && (
        <p id="login-error" role="alert" className="text-caption text-primary-soft-foreground">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {signup ? (pending ? t`Creating…` : t`Create account`) : pending ? t`Signing in…` : t`Sign in`}
      </Button>
    </Form>
  );
}
