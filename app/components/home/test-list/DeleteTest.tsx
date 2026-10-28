import { useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { Trash2 } from "lucide-react";
import { useFetcher } from "react-router";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Button } from "~/components/ui/button";
import type { TestSummary } from "~/lib/views";

/** The delete button of one test: a ghost icon on mobile, an outlined one on desktop. It asks first. */
export function DeleteTest({ test, outlined = false, className }: { test: TestSummary; outlined?: boolean; className?: string }) {
  const { t } = useLingui();
  const fetcher = useFetcher();
  const title = test.title;
  return (
    <ConfirmDialog
      title={t`Delete “${title}”?`}
      description={t`The test and its saved result will be deleted. This can't be undone.`}
      confirmLabel={t`Delete`}
      onConfirm={() => fetcher.submit(null, { method: "delete", action: `/api/tests/${test.id}` })}
    >
      <Button
        variant={outlined ? "outline" : "ghost"}
        size="icon"
        aria-label={t`Delete “${title}”`}
        className={cn(outlined ? "text-subtle-foreground md:w-11" : "text-subtle-foreground", className)}
      >
        <Trash2 aria-hidden="true" className={outlined ? undefined : "size-4.5"} />
      </Button>
    </ConfirmDialog>
  );
}
