import { msg } from "@lingui/core/macro";
import { data, redirect } from "react-router";
import type { Route } from "./+types/signin";
import { Login } from "~/components/login";
import { isSignedIn, safeRedirect, signIn } from "~/lib/auth.server";
import { verifyUser } from "~/lib/users.server";
import { localeFromMatches, requestLocale, translate } from "~/lib/i18n";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Sign in`)} · 文法ドリル` }];
}

export async function loader({ request, url }: Route.LoaderArgs) {
  if (await isSignedIn(request)) throw redirect(safeRedirect(url.searchParams.get("redirectTo")));
  return null;
}

// A second's wait makes guessing slow; a long password does the real work.
const slowDown = () => new Promise((resolve) => setTimeout(resolve, 1000));

/** Signs in with a username or an email, and the password, then goes on to `redirectTo`. */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const id = await verifyUser(String(form.get("name") ?? "").trim(), String(form.get("password") ?? ""));
  if (id === null) {
    await slowDown();
    return data({ error: translate(requestLocale(request), msg`Wrong username (or email) or password.`) }, { status: 401 });
  }
  return signIn(request, id, safeRedirect(form.get("redirectTo")));
}

export default function SigninRoute({ actionData }: Route.ComponentProps) {
  return <Login signup={false} error={actionData?.error} />;
}
