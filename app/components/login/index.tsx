import { Link, useSearchParams } from "react-router";
import { AuthCard } from "~/components/layout/AuthCard";
import { LoginForm } from "./LoginForm";

const LINK_CLASS = "font-medium text-primary underline-offset-4 hover:underline";

/** /login signs in; /login?mode=signup makes an account (with the sign-up code) and signs in. */
export function Login({ error }: { error?: string }) {
  const [params] = useSearchParams();
  const signup = params.get("mode") === "signup";
  const redirectTo = params.get("redirectTo") ?? "/";
  const switchTo = new URLSearchParams({ ...(signup ? {} : { mode: "signup" }), redirectTo });

  return (
    <AuthCard
      title={signup ? "アカウント作成" : "ログイン"}
      description={
        signup
          ? "ユーザー名とメールアドレス、パスワードを決めて、招待コードを入力してください。"
          : "ユーザー名とパスワードを入力してください。"
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
          <Link to={`/login?${switchTo}`} className={LINK_CLASS}>
            {signup ? "ログイン" : "アカウントを作成"}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
