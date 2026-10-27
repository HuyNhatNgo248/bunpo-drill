import { Link } from "react-router";
import { AuthCard } from "~/components/layout/AuthCard";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

/**
 * /forgot-password: ask for a reset link by email. After sending, the page says the same thing
 * whether or not an account has the email.
 */
export function ForgotPassword({ result }: { result?: { sent?: string; error?: string } }) {
  return (
    <AuthCard
      title="パスワードの再設定"
      description="アカウントのメールアドレスを入力してください。新しいパスワードを決めるリンクを送ります。"
    >
      {result?.sent ? (
        <p role="status" className="leading-sentence">
          {result.sent} のアカウントがあれば、リンクを送りました。リンクは1時間有効です。届かない場合は、迷惑メールのフォルダも確認してください。
        </p>
      ) : (
        <ForgotPasswordForm error={result?.error} />
      )}
      <Link to="/login" className="text-center text-caption font-medium text-primary underline-offset-4 hover:underline">
        ログインに戻る
      </Link>
    </AuthCard>
  );
}
