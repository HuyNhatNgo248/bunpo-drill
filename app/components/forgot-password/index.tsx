import { Trans, useLingui } from "@lingui/react/macro";
import { Link } from "react-router";
import { AuthCard } from "~/components/layout/AuthCard";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

/**
 * /forgot-password: ask for a reset link by email. After sending, the page says the same thing
 * whether or not an account has the email.
 */
export function ForgotPassword({ result }: { result?: { sent?: string; error?: string } }) {
  const { t } = useLingui();
  const sent = result?.sent;
  return (
    <AuthCard
      title={t`Reset your password`}
      description={t`Enter your account's email address. We'll send a link to choose a new password.`}
    >
      {sent ? (
        <p role="status" className="leading-sentence">
          <Trans>
            If there's an account for {sent}, we sent the link. It works for one hour. If it doesn't arrive, check your spam folder too.
          </Trans>
        </p>
      ) : (
        <ForgotPasswordForm error={result?.error} />
      )}
      <Link to="/signin" className="text-center text-caption font-medium text-indigo underline-offset-4 hover:underline">
        <Trans>Back to sign in</Trans>
      </Link>
    </AuthCard>
  );
}
