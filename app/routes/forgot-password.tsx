import { msg } from "@lingui/core/macro";
import { data } from "react-router";
import type { Route } from "./+types/forgot-password";
import { ForgotPassword } from "~/components/forgot-password";
import { createPasswordReset, sendPasswordResetMail } from "~/lib/password-reset.server";
import { checkEmail, normalizeEmail } from "~/lib/users";
import { findUserByEmail } from "~/lib/users.server";
import { localeFromMatches, requestLocale, translate } from "~/lib/i18n";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Reset your password`)} · 文法ドリル` }];
}

/** POST /forgot-password with an email: send a reset link when an account has that email. */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const invalid = checkEmail(email);
  if (invalid) return data({ error: translate(requestLocale(request), invalid) }, { status: 400 });
  const user = await findUserByEmail(email);
  const token = user && (await createPasswordReset(user.id));
  // The answer is the same with or without an account, and it does not wait for the email,
  // so neither the answer nor its timing tells a visitor who has an account.
  if (user && token) {
    sendPasswordResetMail({ ...user, email }, token, requestLocale(request)).catch((error) => console.error("[forgot-password] the email failed", error));
  }
  return { sent: email };
}

export default function ForgotPasswordRoute({ actionData }: Route.ComponentProps) {
  return <ForgotPassword result={actionData} />;
}
