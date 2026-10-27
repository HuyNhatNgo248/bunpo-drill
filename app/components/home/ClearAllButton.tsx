import { Trash2 } from "lucide-react";
import { useFetcher } from "react-router";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Button } from "~/components/ui/button";
import { CLEAR_ALL_KEY } from "./helpers/fetchers";

/** Deletes every test after the user confirms. */
export function ClearAllButton({ count }: { count: number }) {
  const clearAll = useFetcher({ key: CLEAR_ALL_KEY });
  return (
    <ConfirmDialog
      title="模擬試験をすべて削除しますか？"
      description={`${count}件のテストと結果がすべて削除されます。この操作は取り消せません。`}
      confirmLabel="すべて削除"
      onConfirm={() => clearAll.submit(null, { method: "delete", action: "/api/tests" })}
    >
      <Button variant="outline" className="px-3 text-[13px] text-secondary-foreground md:px-4 md:text-sm">
        <Trash2 aria-hidden="true" />
        <span className="md:hidden">すべて削除</span>
        <span className="hidden md:inline">模擬試験をすべて削除</span>
      </Button>
    </ConfirmDialog>
  );
}
