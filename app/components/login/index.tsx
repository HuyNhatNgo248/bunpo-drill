import { Trans, useLingui } from "@lingui/react/macro";
import { Link, useSearchParams } from "react-router";
import { AuthCard } from "~/components/layout/AuthCard";
import { LoginForm } from "./LoginForm";

// Proverbs, so no author to credit.
const QUOTES = [
  ["七転び八起き", "Fall seven times, get up eight."],
  ["継続は力なり", "Persistence is power."],
  ["千里の道も一歩から", "A journey of a thousand miles starts with one step."],
  ["初心忘るべからず", "Never forget your beginner's mind."],
  ["石の上にも三年", "Perseverance wins in the end."],
  ["塵も積もれば山となる", "Even dust, piled up, becomes a mountain."],
  ["習うより慣れよ", "Get used to it, rather than just learning it."],
];

function QuoteFooter() {
  // Same quote all day, so server and browser agree.
  const [ja, en] = QUOTES[Math.floor(Date.now() / 864e5) % QUOTES.length];
  return (
    <footer className="border-t px-4 py-6 text-center text-caption text-muted-foreground">
      <p className="text-base font-medium text-foreground">{ja}</p>
      <p>{en}</p>
    </footer>
  );
}

const LINK_CLASS = "font-medium text-indigo underline-offset-4 hover:underline";

/** /signin signs in; /signup makes an account and signs in. Both keep `redirectTo` for after. */
export function Login({ signup, error }: { signup: boolean; error?: string }) {
  const { t } = useLingui();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/";
  const switchTo = `${signup ? "/signin" : "/signup"}?${new URLSearchParams({ redirectTo })}`;

  return (
    <AuthCard
      footer={<QuoteFooter />}
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
