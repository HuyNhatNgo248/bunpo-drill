import { data } from "react-router";
import type { Route } from "./+types/forgot-password";
import { ForgotPassword } from "~/components/forgot-password";
import { createPasswordReset, sendPasswordResetMail } from "~/lib/password-reset.server";
import { checkEmail, normalizeEmail } from "~/lib/users";
import { findUserByEmail } from "~/lib/users.server";

export function meta() {
  return [{ title: "パスワードの再設定 · 文法ドリル" }];
}

/** POST /forgot-password with an email: send a reset link when an account has that email. */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const invalid = checkEmail(email);
  if (invalid) return data({ error: invalid }, { status: 400 });
  const user = await findUserByEmail(email);
  const token = user && (await createPasswordReset(user.id));
  // The answer is the same with or without an account, and it does not wait for the email,
  // so neither the answer nor its timing tells a visitor who has an account.
  if (user && token) {
    sendPasswordResetMail({ ...user, email }, token).catch((error) => console.error("[forgot-password] the email failed", error));
  }
  return { sent: email };
}

export default function ForgotPasswordRoute({ actionData }: Route.ComponentProps) {
  return <ForgotPassword result={actionData} />;
}
