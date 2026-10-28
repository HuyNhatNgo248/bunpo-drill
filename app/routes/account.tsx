import { msg } from "@lingui/core/macro";
import { data } from "react-router";
import type { Route } from "./+types/account";
import { Account } from "~/components/account";
import type { AccountResult } from "~/components/account/types";
import { requireUserId } from "~/lib/auth.server";
import { checkEmail, checkName, checkNewPassword, normalizeEmail } from "~/lib/users";
import { changePassword, getUser, renameUser, setEmail } from "~/lib/users.server";
import { localeFromMatches, requestLocale, translate } from "~/lib/i18n";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Account`)} · 文法ドリル` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(await requireUserId(request));
  if (!user) throw data("Not found", { status: 404 });
  return { user };
}

/**
 * POST /account: intent "name" renames, intent "email" sets the email that password resets go to,
 * intent "password" changes the password (needs the current one).
 */
export async function action({ request }: Route.ActionArgs) {
  const id = await requireUserId(request);
  const form = await request.formData();
  const locale = requestLocale(request);
  if (form.get("intent") === "name") {
    const name = String(form.get("name") ?? "").trim();
    const invalid = checkName(name);
    if (invalid) return data<AccountResult>({ form: "name", error: translate(locale, invalid) }, { status: 400 });
    if (!(await renameUser(id, name))) {
      return data<AccountResult>({ form: "name", error: translate(locale, msg`That username is already taken.`) }, { status: 409 });
    }
    return data<AccountResult>({ form: "name", saved: translate(locale, msg`Username changed.`) });
  }
  if (form.get("intent") === "email") {
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const invalid = checkEmail(email);
    if (invalid) return data<AccountResult>({ form: "email", error: translate(locale, invalid) }, { status: 400 });
    if (!(await setEmail(id, email))) {
      return data<AccountResult>({ form: "email", error: translate(locale, msg`That email address is already in use.`) }, { status: 409 });
    }
    return data<AccountResult>({ form: "email", saved: translate(locale, msg`Email address saved.`) });
  }
  const next = String(form.get("next") ?? "");
  const invalid = checkNewPassword(next);
  if (invalid) return data<AccountResult>({ form: "password", error: translate(locale, invalid) }, { status: 400 });
  if (!(await changePassword(id, String(form.get("current") ?? ""), next))) {
    return data<AccountResult>({ form: "password", error: translate(locale, msg`Your current password is wrong.`) }, { status: 401 });
  }
  return data<AccountResult>({ form: "password", saved: translate(locale, msg`Password changed.`) });
}

export default function AccountRoute({ loaderData, actionData }: Route.ComponentProps) {
  return <Account name={loaderData.user.name} email={loaderData.user.email} result={actionData} />;
}
