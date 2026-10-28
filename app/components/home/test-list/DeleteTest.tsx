import { cn } from "~/lib/utils";
import { Trash2 } from "lucide-react";
import { useFetcher } from "react-router";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Button } from "~/components/ui/button";
import type { TestSummary } from "~/lib/views";

/** The delete button of one test: a ghost icon on mobile, an outlined one on desktop. It asks first. */
export function DeleteTest({ test, outlined = false, className }: { test: TestSummary; outlined?: boolean; className?: string }) {
  const fetcher = useFetcher();
  return (
    <ConfirmDialog
      title={`「${test.title}」を削除しますか？`}
      description="テストと保存された結果が削除されます。この操作は取り消せません。"
      confirmLabel="削除"
      onConfirm={() => fetcher.submit(null, { method: "delete", action: `/api/tests/${test.id}` })}
    >
      <Button
        variant={outlined ? "outline" : "ghost"}
        size="icon"
        aria-label={`「${test.title}」を削除`}
        className={cn(outlined ? "text-subtle-foreground md:w-11" : "text-subtle-foreground", className)}
      >
        <Trash2 aria-hidden="true" className={outlined ? undefined : "size-4.5"} />
      </Button>
    </ConfirmDialog>
  );
}
