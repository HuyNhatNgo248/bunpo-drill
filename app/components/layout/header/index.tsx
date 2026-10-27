import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import { Brand } from "./Brand";

/**
 * Desktop: brand on the left, "← テスト一覧" on the right when `back` is set,
 * or an アカウント link when `account` is set.
 * Mobile: with a `mobileTitle`, a back chevron and the title replace the brand.
 */
export function AppHeader({
  back = false,
  account = false,
  mobileTitle,
  mobileAside,
}: {
  back?: boolean;
  account?: boolean;
  mobileTitle?: string;
  mobileAside?: React.ReactNode;
}) {
  return (
    <header className="border-b bg-card">
      <div className={mobileTitle ? "hidden md:block" : undefined}>
        <div className="mx-auto flex max-w-260 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5">
          <Brand />
          {back && (
            <Link to="/" className="text-[13px] text-subtle-foreground no-underline hover:text-foreground">
              ← テスト一覧
            </Link>
          )}
          {account && (
            <Link to="/account" className="text-[13px] text-subtle-foreground no-underline hover:text-foreground">
              アカウント
            </Link>
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
