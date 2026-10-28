import { Link, useSearchParams } from "react-router";
import { AuthCard } from "~/components/layout/AuthCard";
import { LoginForm } from "./LoginForm";

const LINK_CLASS = "font-medium text-indigo underline-offset-4 hover:underline";

/** /signin signs in; /signup makes an account and signs in. Both keep `redirectTo` for after. */
export function Login({ signup, error }: { signup: boolean; error?: string }) {
  const [params] = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/";
  const switchTo = `${signup ? "/signin" : "/signup"}?${new URLSearchParams({ redirectTo })}`;

  return (
    <AuthCard
      title={signup ? "アカウント作成" : "ログイン"}
      description={
        signup
          ? "ユーザー名とメールアドレス、パスワードを決めてください。"
          : "ユーザー名またはメールアドレスと、パスワードを入力してください。"
      }
    >
      {/* key: switching modes starts with empty fields. */}
      <LoginForm key={String(signup)} signup={signup} redirectTo={redirectTo} error={error} />
      <div className="flex flex-col items-center gap-2 text-caption text-muted-foreground">
        {!signup && (
          <Link to="/forgot-password" className={LINK_CLASS}>
            パスワードを忘れた場合
          </Link>
        )}
        <p>
          {signup ? "アカウントをお持ちの方は " : "はじめての方は "}
          <Link to={switchTo} className={LINK_CLASS}>
            {signup ? "ログイン" : "アカウントを作成"}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
