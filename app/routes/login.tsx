import { data, Form, Link, redirect, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { AppHeader } from "~/components/app-header";
import { PasswordField } from "~/components/password-field";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { checkSignupCode, isSignedIn, safeRedirect, signIn } from "~/lib/auth.server";
import { createUser, verifyUser } from "~/lib/users.server";
import { checkName, checkNewPassword } from "~/lib/users";

export function meta({ location }: Route.MetaArgs) {
  return [{ title: `${location.search.includes("mode=signup") ? "アカウント作成" : "ログイン"} · 文法ドリル` }];
}

export async function loader({ request, url }: Route.LoaderArgs) {
  if (await isSignedIn(request)) throw redirect(safeRedirect(url.searchParams.get("redirectTo")));
  return null;
}

// A second's wait makes guessing slow; a long password does the real work.
const slowDown = () => new Promise((resolve) => setTimeout(resolve, 1000));

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const redirectTo = safeRedirect(form.get("redirectTo"));

  if (form.get("intent") === "signup") {
    if (!checkSignupCode(String(form.get("code") ?? ""))) {
      await slowDown();
      return data({ error: "招待コードが違います。" }, { status: 401 });
    }
    const invalid = checkName(name) ?? checkNewPassword(password);
    if (invalid) return data({ error: invalid }, { status: 400 });
    const id = await createUser(name, password);
    if (id === null) return data({ error: "この名前はもう使われています。" }, { status: 409 });
    return signIn(request, id, redirectTo);
  }

  const id = await verifyUser(name, password);
  if (id === null) {
    await slowDown();
    return data({ error: "名前かパスワードが違います。" }, { status: 401 });
  }
  return signIn(request, id, redirectTo);
}

const INPUT =
  "h-11 rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-primary md:h-10 md:text-sm";

/** /login signs in; /login?mode=signup makes an account (with the sign-up code) and signs in. */
export default function Login({ actionData }: Route.ComponentProps) {
  const [params] = useSearchParams();
  const signup = params.get("mode") === "signup";
  const redirectTo = params.get("redirectTo") ?? "/";
  const pending = useNavigation().state !== "idle";
  const error = actionData?.error;
  const invalid = error ? true : undefined;
  const switchTo = new URLSearchParams({ ...(signup ? {} : { mode: "signup" }), redirectTo });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="flex justify-center px-4 pt-14 pb-16 md:pt-24">
        <Card className="flex w-full max-w-[380px] flex-col gap-5 p-6 md:p-7">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight">{signup ? "アカウント作成" : "ログイン"}</h1>
            <p className="text-[13px] text-muted-foreground">
              {signup ? "名前とパスワードを決めて、招待コードを入力してください。" : "名前とパスワードを入力してください。"}
            </p>
          </div>
          {/* key: switching modes starts with empty fields. */}
          <Form key={String(signup)} method="post" className="flex flex-col gap-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <input type="hidden" name="intent" value={signup ? "signup" : "login"} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">名前</span>
              <input
                name="name"
                required
                autoFocus
                maxLength={30}
                autoComplete="username"
                aria-invalid={invalid}
                aria-describedby={error ? "login-error" : undefined}
                className={INPUT}
              />
            </label>
            <PasswordField
              label="パスワード"
              hint={signup ? "8文字以上" : undefined}
              name="password"
              required
              minLength={signup ? 8 : undefined}
              autoComplete={signup ? "new-password" : "current-password"}
              aria-invalid={invalid}
              aria-describedby={error ? "login-error" : undefined}
              className={INPUT}
            />
            {signup && (
              <PasswordField
                label="招待コード"
                name="code"
                required
                autoComplete="off"
                aria-invalid={invalid}
                aria-describedby={error ? "login-error" : undefined}
                className={INPUT}
              />
            )}
            {error && (
              <p id="login-error" role="alert" className="text-[13px] text-primary-soft-foreground">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {signup ? (pending ? "作成中…" : "アカウントを作成") : pending ? "ログイン中…" : "ログイン"}
            </Button>
          </Form>
          <p className="text-center text-[13px] text-muted-foreground">
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
