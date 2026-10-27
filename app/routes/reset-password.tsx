import { data } from "react-router";
import type { Route } from "./+types/reset-password";
import { ResetPassword } from "~/components/reset-password";
import { signIn } from "~/lib/auth.server";
import { isPasswordResetValid, resetPassword } from "~/lib/password-reset.server";
import { checkNewPassword } from "~/lib/users";

export function meta() {
  return [{ title: "新しいパスワード · 文法ドリル" }];
}

/** GET /reset-password?token=…: the link from the email. */
export async function loader({ url }: Route.LoaderArgs) {
  const token = url.searchParams.get("token") ?? "";
  return { token, valid: await isPasswordResetValid(token) };
}

/** POST /reset-password with the token and a new password: set it, use the link up, and sign in. */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const invalid = checkNewPassword(password);
  if (invalid) return data({ error: invalid }, { status: 400 });
  const userId = await resetPassword(String(form.get("token") ?? ""), password);
  if (userId === null) {
    return data({ error: "このリンクは期限切れか、もう使われています。もう一度メールを送ってください。" }, { status: 410 });
  }
  return signIn(request, userId, "/");
}

export default function ResetPasswordRoute({ loaderData, actionData }: Route.ComponentProps) {
  return <ResetPassword token={loaderData.token} valid={loaderData.valid} error={actionData?.error} />;
}
