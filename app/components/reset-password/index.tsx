import { Link } from "react-router";
import { AuthCard } from "~/components/layout/AuthCard";
import { ResetPasswordForm } from "./ResetPasswordForm";

const LINK_CLASS = "text-center text-caption font-medium text-primary underline-offset-4 hover:underline";

/** /reset-password: the page the emailed link opens. A link that is expired or used asks for a new one. */
export function ResetPassword({ token, valid, error }: { token: string; valid: boolean; error?: string }) {
  if (!valid) {
    return (
      <AuthCard title="リンクが使えません" description="このリンクは期限切れか、もう使われています。もう一度メールを送ってください。">
        <Link to="/forgot-password" className={LINK_CLASS}>
          もう一度メールを送る
        </Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="新しいパスワード" description="新しいパスワードを決めてください。変更すると、そのままログインします。">
      <ResetPasswordForm token={token} error={error} />
      <Link to="/forgot-password" className={LINK_CLASS}>
        もう一度メールを送る
      </Link>
    </AuthCard>
  );
}
