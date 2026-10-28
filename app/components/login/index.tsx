import { Trans, useLingui } from "@lingui/react/macro";
import { Link, useSearchParams } from "react-router";
import { AuthCard } from "~/components/layout/AuthCard";
import { LoginForm } from "./LoginForm";

const LINK_CLASS = "font-medium text-indigo underline-offset-4 hover:underline";

/** /signin signs in; /signup makes an account and signs in. Both keep `redirectTo` for after. */
export function Login({ signup, error }: { signup: boolean; error?: string }) {
  const { t } = useLingui();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/";
  const switchTo = `${signup ? "/signin" : "/signup"}?${new URLSearchParams({ redirectTo })}`;

  return (
    <AuthCard
      title={signup ? t`Sign up` : t`Sign in`}
      description={
        signup
          ? t`Choose a username, an email address and a password.`
          : t`Enter your username or email address, and your password.`
      }
    >
      {/* key: switching modes starts with empty fields. */}
      <LoginForm key={String(signup)} signup={signup} redirectTo={redirectTo} error={error} />
      <div className="flex flex-col items-center gap-2 text-caption text-muted-foreground">
        {!signup && (
          <Link to="/forgot-password" className={LINK_CLASS}>
            <Trans>Forgot your password?</Trans>
          </Link>
        )}
        <p>
          {signup ? (
            <Trans>
              Have an account?{" "}
              <Link to={switchTo} className={LINK_CLASS}>
                Sign in
              </Link>
            </Trans>
          ) : (
            <Trans>
              New here?{" "}
              <Link to={switchTo} className={LINK_CLASS}>
                Create account
              </Link>
            </Trans>
          )}
        </p>
      </div>
    </AuthCard>
  );
}
