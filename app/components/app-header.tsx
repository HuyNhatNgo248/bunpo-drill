import { ChevronLeft } from "lucide-react";
import { Form, Link } from "react-router";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-foreground no-underline">
      <span className="flex size-[30px] items-center justify-center rounded-lg bg-primary font-jp text-sm font-bold text-primary-foreground md:size-8 md:text-[15px]">
        文
      </span>
      <span className="font-jp text-base font-semibold">文法ドリル</span>
    </Link>
  );
}

/**
 * Desktop: brand on the left, "← テスト一覧" on the right when `back` is set,
 * or a ログアウト button when `logout` is set.
 * Mobile: with a `mobileTitle`, a back chevron and the title replace the brand.
 */
export function AppHeader({
  back = false,
  logout = false,
  mobileTitle,
  mobileAside,
}: {
  back?: boolean;
  logout?: boolean;
  mobileTitle?: string;
  mobileAside?: React.ReactNode;
}) {
  return (
    <header className="border-b bg-card">
      <div className={mobileTitle ? "hidden md:block" : undefined}>
        <div className="mx-auto flex max-w-[1040px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5">
          <Brand />
          {back && (
            <Link to="/" className="text-[13px] text-subtle-foreground no-underline hover:text-foreground">
              ← テスト一覧
            </Link>
          )}
          {logout && (
            <Form method="post" action="/logout">
              <button type="submit" className="text-[13px] text-subtle-foreground hover:text-foreground">
                ログアウト
              </button>
            </Form>
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
