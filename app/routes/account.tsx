import { data } from "react-router";
import type { Route } from "./+types/account";
import { Account } from "~/components/account";
import type { AccountResult } from "~/components/account/types";
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

/** POST /account: intent "name" renames, intent "password" changes the password (needs the current one). */
export async function action({ request }: Route.ActionArgs) {
  const id = await requireUserId(request);
  const form = await request.formData();
  if (form.get("intent") === "name") {
    const name = String(form.get("name") ?? "").trim();
    const invalid = checkName(name);
    if (invalid) return data<AccountResult>({ form: "name", error: invalid }, { status: 400 });
    if (!(await renameUser(id, name))) return data<AccountResult>({ form: "name", error: "この名前はもう使われています。" }, { status: 409 });
    return data<AccountResult>({ form: "name", saved: "名前を変更しました。" });
  }
  const next = String(form.get("next") ?? "");
  const invalid = checkNewPassword(next);
  if (invalid) return data<AccountResult>({ form: "password", error: invalid }, { status: 400 });
  if (!(await changePassword(id, String(form.get("current") ?? ""), next))) {
    return data<AccountResult>({ form: "password", error: "現在のパスワードが違います。" }, { status: 401 });
  }
  return data<AccountResult>({ form: "password", saved: "パスワードを変更しました。" });
}

export default function AccountRoute({ loaderData, actionData }: Route.ComponentProps) {
  return <Account name={loaderData.user.name} result={actionData} />;
}
