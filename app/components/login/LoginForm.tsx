import { Form, useNavigation } from "react-router";
import { PasswordField } from "~/components/form/PasswordField";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";

/**
 * The username and password fields; on sign-up also the email (where a password reset goes).
 * The error of the last try shows above the button.
 */
export function LoginForm({ signup, redirectTo, error }: { signup: boolean; redirectTo: string; error?: string }) {
  const pending = useNavigation().state !== "idle";
  const invalid = error ? true : undefined;
  const describedBy = error ? "login-error" : undefined;

  return (
    <Form method="post" className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="intent" value={signup ? "signup" : "login"} />
      <label className="flex flex-col gap-1.5">
        <span className="text-caption font-medium">ユーザー名</span>
        <input
          name="name"
          required
          autoFocus
          maxLength={30}
          autoComplete="username"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={INPUT_CLASS}
        />
      </label>
      {signup && (
        // The hint stays outside the label, so a screen reader reads the field's name alone.
        <div className="flex flex-col gap-1.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-caption font-medium">メールアドレス</span>
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={INPUT_CLASS}
            />
          </label>
          <span className="text-xs text-muted-foreground">パスワードを忘れたときに、再設定のリンクを送ります。</span>
        </div>
      )}
      <PasswordField
        label="パスワード"
        hint={signup ? "8文字以上" : undefined}
        name="password"
        required
        minLength={signup ? 8 : undefined}
        autoComplete={signup ? "new-password" : "current-password"}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={INPUT_CLASS}
      />
      {error && (
        <p id="login-error" role="alert" className="text-caption text-primary-soft-foreground">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {signup ? (pending ? "作成中…" : "アカウントを作成") : pending ? "ログイン中…" : "ログイン"}
      </Button>
    </Form>
  );
}
