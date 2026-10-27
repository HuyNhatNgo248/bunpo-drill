import { Form } from "react-router";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useSubmitting } from "./hooks/useSubmitting";
import { Status } from "./Status";
import type { AccountResult } from "./types";

/** Sets the email that a password reset link goes to. Accounts made before emails have none yet. */
export function EmailForm({ email, result }: { email: string | null; result?: AccountResult }) {
  const saving = useSubmitting("email");
  return (
    <Card className="flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">メールアドレス</h2>
        <p className="text-caption text-muted-foreground">
          {email ? "パスワードを忘れたときに、再設定のリンクを送ります。" : "まだありません。登録すると、パスワードを忘れても再設定できます。"}
        </p>
      </div>
      {/* key: after a save, the field shows the saved email. */}
      <Form key={email ?? ""} method="post" className="flex flex-col gap-3">
        <input type="hidden" name="intent" value="email" />
        <input
          name="email"
          type="email"
          aria-label="メールアドレス"
          required
          maxLength={254}
          autoComplete="email"
          defaultValue={email ?? ""}
          aria-invalid={result?.error ? true : undefined}
          className={INPUT_CLASS}
        />
        <Status result={result} />
        <Button type="submit" disabled={saving} className="self-end">
          {saving ? "保存中…" : "保存"}
        </Button>
      </Form>
    </Card>
  );
}
