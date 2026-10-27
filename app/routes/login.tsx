import { data, redirect } from "react-router";
import type { Route } from "./+types/login";
import { Login } from "~/components/login";
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
    if (id === null) return data({ error: "このユーザー名はもう使われています。" }, { status: 409 });
    return signIn(request, id, redirectTo);
  }

  const id = await verifyUser(name, password);
  if (id === null) {
    await slowDown();
    return data({ error: "ユーザー名かパスワードが違います。" }, { status: 401 });
  }
  return signIn(request, id, redirectTo);
}

export default function LoginRoute({ actionData }: Route.ComponentProps) {
  return <Login error={actionData?.error} />;
}
