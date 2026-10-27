import { Form } from "react-router";
import { AppHeader } from "~/components/layout/header";
import { Button } from "~/components/ui/button";
import { NameForm } from "./NameForm";
import { PasswordForm } from "./PasswordForm";
import type { AccountResult } from "./types";

/** The account page: change the name or the password, or log out. `result` goes to the form it is for. */
export function Account({ name, result }: { name: string; result?: AccountResult }) {
  const resultOf = (form: AccountResult["form"]) => (result?.form === form ? result : undefined);

  return (
    <div className="min-h-screen">
      <AppHeader back mobileTitle="アカウント" />
      <main className="mx-auto flex max-w-130 flex-col gap-3.5 px-4 pt-4 pb-10 md:gap-5 md:px-6 md:pt-10 md:pb-16">
        <h1 className="hidden text-[26px] font-bold tracking-tight md:block">アカウント</h1>
        <NameForm name={name} result={resultOf("name")} />
        <PasswordForm result={resultOf("password")} />
        <Form method="post" action="/logout" className="self-start">
          <Button type="submit" variant="outline">
            ログアウト
          </Button>
        </Form>
      </main>
    </div>
  );
}
