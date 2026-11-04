import { useLingui } from "@lingui/react/macro";
import { Form } from "react-router";
import { Status } from "~/components/form/Status";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";
import { FormCard } from "./FormCard";
import { useSubmitting } from "./hooks/useSubmitting";
import type { AccountResult } from "./types";

/** Changes the user's name, which is also the login name. */
export function NameForm({ name, result }: { name: string; result?: AccountResult }) {
  const saving = useSubmitting("name");
  const { t } = useLingui();
  return (
    <FormCard title={t`Username`} description={t`You sign in with it.`}>
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
        <Status error={result?.error} saved={result?.saved} />
        <Button type="submit" disabled={saving} className="self-end">
          {saving ? t`Saving…` : t`Save`}
        </Button>
      </Form>
    </FormCard>
  );
}
