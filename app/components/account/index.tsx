import { Trans, useLingui } from "@lingui/react/macro";
import { Form } from "react-router";
import { BackLink } from "~/components/layout/BackLink";
import { AppHeader } from "~/components/layout/header";
import { Button } from "~/components/ui/button";
import { EmailForm } from "./EmailForm";
import { NameForm } from "./NameForm";
import { PasswordForm } from "./PasswordForm";
import type { AccountResult } from "./types";

/** The account page: change the username, the email or the password, or log out. `result` goes to the form it is for. */
export function Account({ name, email, result }: { name: string; email: string | null; result?: AccountResult }) {
  const { t } = useLingui();
  const resultOf = (form: AccountResult["form"]) => (result?.form === form ? result : undefined);

  return (
    <div className="min-h-screen">
      <AppHeader mobileTitle={t`Account`} />
      <main className="mx-auto flex max-w-130 flex-col gap-3.5 px-4 pt-4 pb-10 md:gap-5 md:px-6 md:pt-10 md:pb-16">
        <div className="hidden flex-col gap-2 md:flex">
          <BackLink />
          <h1 className="text-title font-bold tracking-tight">
            <Trans>Account</Trans>
          </h1>
        </div>
        <NameForm name={name} result={resultOf("name")} />
        <EmailForm email={email} result={resultOf("email")} />
        <PasswordForm result={resultOf("password")} />
        <Form method="post" action="/logout" className="self-start">
          <Button type="submit" variant="outline">
            <Trans>Sign out</Trans>
          </Button>
        </Form>
      </main>
    </div>
  );
}
