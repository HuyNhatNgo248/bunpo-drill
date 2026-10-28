import { Trans, useLingui } from "@lingui/react/macro";
import { Form } from "react-router";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useSubmitting } from "./hooks/useSubmitting";
import { Status } from "./Status";
import type { AccountResult } from "./types";

/** Changes the user's name, which is also the login name. */
export function NameForm({ name, result }: { name: string; result?: AccountResult }) {
  const saving = useSubmitting("name");
  const { t } = useLingui();
  return (
    <Card className="flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">
          <Trans>Username</Trans>
        </h2>
        <p className="text-caption text-muted-foreground">
          <Trans>You sign in with it.</Trans>
        </p>
      </div>
      {/* key: after a save, the field shows the saved name. */}
      <Form key={name} method="post" className="flex flex-col gap-3">
        <input type="hidden" name="intent" value="name" />
        <input
          name="name"
          aria-label={t`Username`}
          required
          maxLength={30}
          autoComplete="username"
          defaultValue={name}
          aria-invalid={result?.error ? true : undefined}
          className={INPUT_CLASS}
        />
        <Status result={result} />
        <Button type="submit" disabled={saving} className="self-end">
          {saving ? t`Saving…` : t`Save`}
        </Button>
      </Form>
    </Card>
  );
}
