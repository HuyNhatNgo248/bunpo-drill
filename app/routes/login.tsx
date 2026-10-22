import { data, Form, redirect, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { AppHeader } from "~/components/app-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { checkPassword, isSignedIn, safeRedirect, signIn } from "~/lib/auth.server";

export function meta() {
  return [{ title: "ログイン · 文法ドリル" }];
}

export async function loader({ request, url }: Route.LoaderArgs) {
  if (await isSignedIn(request)) throw redirect(safeRedirect(url.searchParams.get("redirectTo")));
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const password = form.get("password");
  if (typeof password !== "string" || !checkPassword(password)) {
    // A second's wait makes guessing slow; a long password does the real work.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return data({ error: "パスワードが違います。" }, { status: 401 });
  }
  return signIn(request, safeRedirect(form.get("redirectTo")));
}

export default function Login({ actionData }: Route.ComponentProps) {
  const [params] = useSearchParams();
  const pending = useNavigation().state !== "idle";
  const error = actionData?.error;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="flex justify-center px-4 pt-14 pb-16 md:pt-24">
        <Card className="flex w-full max-w-[380px] flex-col gap-5 p-6 md:p-7">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight">ログイン</h1>
            <p className="text-[13px] text-muted-foreground">パスワードを入力してください。</p>
          </div>
          <Form method="post" className="flex flex-col gap-4">
            <input type="hidden" name="redirectTo" value={params.get("redirectTo") ?? "/"} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">パスワード</span>
              <input
                type="password"
                name="password"
                required
                autoFocus
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                className="h-11 rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-primary md:h-10 md:text-sm"
              />
            </label>
            {error && (
              <p id="login-error" role="alert" className="text-[13px] text-primary-soft-foreground">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "ログイン中…" : "ログイン"}
            </Button>
          </Form>
        </Card>
      </main>
    </div>
  );
}
