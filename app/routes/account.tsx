import { useEffect, useRef } from "react";
import { data, Form, useNavigation } from "react-router";
import type { Route } from "./+types/account";
import { AppHeader } from "~/components/app-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { requireUserId } from "~/lib/auth.server";
import { checkName, checkNewPassword } from "~/lib/users";
import { changePassword, getUser, renameUser } from "~/lib/users.server";

export function meta() {
  return [{ title: "アカウント · 文法ドリル" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(await requireUserId(request));
  if (!user) throw data("Not found", { status: 404 });
  return { user };
}

type Result = { form: "name" | "password"; error?: string; saved?: string };

/** POST /account: intent "name" renames, intent "password" changes the password (needs the current one). */
export async function action({ request }: Route.ActionArgs) {
  const id = await requireUserId(request);
  const form = await request.formData();
  if (form.get("intent") === "name") {
    const name = String(form.get("name") ?? "").trim();
    const invalid = checkName(name);
    if (invalid) return data<Result>({ form: "name", error: invalid }, { status: 400 });
    if (!(await renameUser(id, name))) return data<Result>({ form: "name", error: "この名前はもう使われています。" }, { status: 409 });
    return data<Result>({ form: "name", saved: "名前を変更しました。" });
  }
  const next = String(form.get("next") ?? "");
  const invalid = checkNewPassword(next);
  if (invalid) return data<Result>({ form: "password", error: invalid }, { status: 400 });
  if (!(await changePassword(id, String(form.get("current") ?? ""), next))) {
    return data<Result>({ form: "password", error: "現在のパスワードが違います。" }, { status: 401 });
  }
  return data<Result>({ form: "password", saved: "パスワードを変更しました。" });
}

const INPUT =
  "h-11 rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-primary md:h-10 md:text-sm";

export default function Account({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const busy = (intent: string) => navigation.state !== "idle" && navigation.formData?.get("intent") === intent;
  const result = (form: Result["form"]) => (actionData?.form === form ? actionData : undefined);
  const passwordForm = useRef<HTMLFormElement>(null);

  // A changed password leaves the fields empty.
  useEffect(() => {
    if (actionData?.form === "password" && actionData.saved) passwordForm.current?.reset();
  }, [actionData]);

  return (
    <div className="min-h-screen">
      <AppHeader back mobileTitle="アカウント" />
      <main className="mx-auto flex max-w-[520px] flex-col gap-3.5 px-4 pt-4 pb-10 md:gap-5 md:px-6 md:pt-10 md:pb-16">
        <h1 className="hidden text-[26px] font-bold tracking-tight md:block">アカウント</h1>

        <Card className="flex flex-col gap-4 p-5 md:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">名前</h2>
            <p className="text-[13px] text-muted-foreground">メモに表示されます。ログインにも使います。</p>
          </div>
          {/* key: after a save, the field shows the saved name. */}
          <Form key={loaderData.user.name} method="post" className="flex flex-col gap-3">
            <input type="hidden" name="intent" value="name" />
            <input
              name="name"
              aria-label="名前"
              required
              maxLength={30}
              autoComplete="username"
              defaultValue={loaderData.user.name}
              aria-invalid={result("name")?.error ? true : undefined}
              className={INPUT}
            />
            <Status result={result("name")} />
            <Button type="submit" disabled={busy("name")} className="self-end">
              {busy("name") ? "保存中…" : "保存"}
            </Button>
          </Form>
        </Card>

        <Card className="flex flex-col gap-4 p-5 md:p-6">
          <h2 className="text-base font-semibold">パスワード</h2>
          <Form ref={passwordForm} method="post" className="flex flex-col gap-3">
            <input type="hidden" name="intent" value="password" />
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">現在のパスワード</span>
              <input type="password" name="current" required autoComplete="current-password" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">新しいパスワード</span>
              <input type="password" name="next" required minLength={8} autoComplete="new-password" className={INPUT} />
              <span className="text-xs text-muted-foreground">8文字以上</span>
            </label>
            <Status result={result("password")} />
            <Button type="submit" disabled={busy("password")} className="self-end">
              {busy("password") ? "変更中…" : "パスワードを変更"}
            </Button>
          </Form>
        </Card>

        <Form method="post" action="/logout" className="self-start">
          <Button type="submit" variant="outline">
            ログアウト
          </Button>
        </Form>
      </main>
    </div>
  );
}

function Status({ result }: { result?: Result }) {
  if (result?.error) {
    return (
      <p role="alert" className="text-[13px] text-primary-soft-foreground">
        {result.error}
      </p>
    );
  }
  return result?.saved ? (
    <p role="status" className="text-[13px] text-success">
      {result.saved}
    </p>
  ) : null;
}
