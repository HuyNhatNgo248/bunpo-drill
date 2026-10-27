import { Link, useSearchParams } from "react-router";
import { AppHeader } from "~/components/layout/header";
import { Card } from "~/components/ui/card";
import { LoginForm } from "./LoginForm";

/** /login signs in; /login?mode=signup makes an account (with the sign-up code) and signs in. */
export function Login({ error }: { error?: string }) {
  const [params] = useSearchParams();
  const signup = params.get("mode") === "signup";
  const redirectTo = params.get("redirectTo") ?? "/";
  const switchTo = new URLSearchParams({ ...(signup ? {} : { mode: "signup" }), redirectTo });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="flex justify-center px-4 pt-14 pb-16 md:pt-24">
        <Card className="flex w-full max-w-95 flex-col gap-5 p-6 md:p-7">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight">{signup ? "アカウント作成" : "ログイン"}</h1>
            <p className="text-caption text-muted-foreground">
              {signup ? "ユーザー名とパスワードを決めて、招待コードを入力してください。" : "ユーザー名とパスワードを入力してください。"}
            </p>
          </div>
          {/* key: switching modes starts with empty fields. */}
          <LoginForm key={String(signup)} signup={signup} redirectTo={redirectTo} error={error} />
          <p className="text-center text-caption text-muted-foreground">
            {signup ? "アカウントをお持ちの方は " : "はじめての方は "}
            <Link to={`/login?${switchTo}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {signup ? "ログイン" : "アカウントを作成"}
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
