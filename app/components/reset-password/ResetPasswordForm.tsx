import { Form, useNavigation } from "react-router";
import { PasswordField } from "~/components/form/PasswordField";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";

/** The new password, sent with the token of the link. The error of the last try shows above the button. */
export function ResetPasswordForm({ token, error }: { token: string; error?: string }) {
  const saving = useNavigation().state !== "idle";
  return (
    <Form method="post" className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <PasswordField
        label="新しいパスワード"
        hint="8文字以上"
        name="password"
        required
        autoFocus
        minLength={8}
        autoComplete="new-password"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "reset-error" : undefined}
        className={INPUT_CLASS}
      />
      {error && (
        <p id="reset-error" role="alert" className="text-caption text-primary-soft-foreground">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "変更中…" : "パスワードを変更"}
      </Button>
    </Form>
  );
}
