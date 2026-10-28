import { msg } from "@lingui/core/macro";
import { data, redirect } from "react-router";
import type { Route } from "./+types/signup";
import { Login } from "~/components/login";
import { isSignedIn, safeRedirect, signIn } from "~/lib/auth.server";
import { createUser, findUserByEmail } from "~/lib/users.server";
import { checkEmail, checkName, checkNewPassword, normalizeEmail } from "~/lib/users";
import { localeFromMatches, requestLocale, translate } from "~/lib/i18n";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Sign up`)} · 文法ドリル` }];
}

export async function loader({ request, url }: Route.LoaderArgs) {
  if (await isSignedIn(request)) throw redirect(safeRedirect(url.searchParams.get("redirectTo")));
  return null;
}

/** Makes the account, signs it in, then goes on to `redirectTo`. */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const locale = requestLocale(request);
  const invalid = checkName(name) ?? checkEmail(email) ?? checkNewPassword(password);
  if (invalid) return data({ error: translate(locale, invalid) }, { status: 400 });
  if (await findUserByEmail(email)) return data({ error: translate(locale, msg`That email address is already in use.`) }, { status: 409 });
  const id = await createUser(name, password, email);
  if (id === null) return data({ error: translate(locale, msg`That username is already taken.`) }, { status: 409 });
  return signIn(request, id, safeRedirect(form.get("redirectTo")));
}

export default function SignupRoute({ actionData }: Route.ComponentProps) {
  return <Login signup error={actionData?.error} />;
}
