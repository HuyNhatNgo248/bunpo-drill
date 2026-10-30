import { Trans, useLingui } from "@lingui/react/macro";
import { ChevronLeft, LogIn, LogOut, UserRound } from "lucide-react";
import { Form, Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Brand } from "./Brand";
import { LanguageSwitch } from "./LanguageSwitch";

/**
 * Desktop: brand on the left; on the right the language switch, then Account and Sign out when `account`
 * is set, or Sign in and Create account for a signed-out `guest`.
 * Mobile: the language, Account, Sign out and Sign in buttons show only their icons; with a `mobileTitle`,
 * a back chevron and the title replace the brand.
 */
export function AppHeader({
  account = false,
  guest = false,
  mobileTitle,
  mobileAside,
}: {
  account?: boolean;
  guest?: boolean;
  mobileTitle?: string;
  mobileAside?: React.ReactNode;
}) {
  const { t } = useLingui();

  return (
    <header className="border-b bg-card">
      <div className={mobileTitle ? "hidden md:block" : undefined}>
        <div className="mx-auto flex max-w-260 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 md:px-6 md:py-3.5">
          <Brand />
          <div className="flex items-center gap-1">
            <LanguageSwitch />
            {account && (
              <nav aria-label={t`Account`} className="flex items-center gap-1">
                <NavSeparator />
                <Button asChild variant="ghost" size="sm">
                  <Link to="/account">
                    <UserRound aria-hidden="true" />
                    <span className="sr-only md:not-sr-only">
                      <Trans>Account</Trans>
                    </span>
                  </Link>
                </Button>
                <NavSeparator />
                <Form method="post" action="/logout">
                  <Button type="submit" variant="ghost" size="sm">
                    <LogOut aria-hidden="true" />
                    <span className="sr-only md:not-sr-only">
                      <Trans>Sign out</Trans>
                    </span>
                  </Button>
                </Form>
              </nav>
            )}
            {guest && (
              <nav aria-label={t`Account`} className="flex items-center gap-1">
                <NavSeparator />
                <Button asChild variant="ghost" size="sm">
                  <Link to="/signin">
                    <LogIn aria-hidden="true" />
                    <span className="sr-only md:not-sr-only">
                      <Trans>Sign in</Trans>
                    </span>
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">
                    <Trans>Create account</Trans>
                  </Link>
                </Button>
              </nav>
            )}
          </div>
        </div>
      </div>
      {mobileTitle && (
        <div className="flex items-center gap-1 px-2 py-1 md:hidden">
          <Link
            to="/"
            aria-label={t`Back to the mock tests`}
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

function NavSeparator() {
  return (
    <Separator
      orientation="vertical"
      className="data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
    />
  );
}
