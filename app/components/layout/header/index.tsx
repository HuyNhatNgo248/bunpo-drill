import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Brand } from "./Brand";

/**
 * Desktop: brand on the left, "← テスト一覧" on the right when `back` is set,
 * an アカウント link when `account` is set, or ログイン and アカウントを作成 for a signed-out `guest`.
 * Mobile: with a `mobileTitle`, a back chevron and the title replace the brand.
 */
export function AppHeader({
  back = false,
  account = false,
  guest = false,
  mobileTitle,
  mobileAside,
}: {
  back?: boolean;
  account?: boolean;
  guest?: boolean;
  mobileTitle?: string;
  mobileAside?: React.ReactNode;
}) {
  return (
    <header className="border-b bg-card">
      <div className={mobileTitle ? "hidden md:block" : undefined}>
        <div className="mx-auto flex max-w-260 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5">
          <Brand />
          {back && (
            <Link to="/" className="text-caption text-subtle-foreground no-underline hover:text-foreground">
              ← テスト一覧
            </Link>
          )}
          {account && (
            <Link to="/account" className="text-caption text-subtle-foreground no-underline hover:text-foreground">
              アカウント
            </Link>
          )}
          {guest && (
            <nav aria-label="アカウント" className="flex items-center gap-1">
              <Button asChild variant="link" size="sm">
                <Link to="/signin">ログイン</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">アカウントを作成</Link>
              </Button>
            </nav>
          )}
        </div>
      </div>
      {mobileTitle && (
        <div className="flex items-center gap-1 px-2 py-1 md:hidden">
          <Link
            to="/"
            aria-label="テスト一覧に戻る"
            className="flex size-11 items-center justify-center text-secondary-foreground"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1 truncate text-base font-semibold">{mobileTitle}</div>
          {mobileAside}
        </div>
      )}
    </header>
  );
}
