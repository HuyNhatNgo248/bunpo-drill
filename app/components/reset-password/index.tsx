import { Trans, useLingui } from "@lingui/react/macro";
import { Link } from "react-router";
import { AuthCard } from "~/components/layout/AuthCard";
import { ResetPasswordForm } from "./ResetPasswordForm";

const LINK_CLASS = "text-center text-caption font-medium text-indigo underline-offset-4 hover:underline";

/** /reset-password: the page the emailed link opens. A link that is expired or used asks for a new one. */
export function ResetPassword({ token, valid, error }: { token: string; valid: boolean; error?: string }) {
  const { t } = useLingui();
  if (!valid) {
    return (
      <AuthCard title={t`This link can't be used`} description={t`This link has expired or was already used. Send the email again.`}>
        <Link to="/forgot-password" className={LINK_CLASS}>
          <Trans>Send the email again</Trans>
        </Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard title={t`New password`} description={t`Choose a new password. Changing it signs you in.`}>
      <ResetPasswordForm token={token} error={error} />
      <Link to="/forgot-password" className={LINK_CLASS}>
        <Trans>Send the email again</Trans>
      </Link>
    </AuthCard>
  );
}
