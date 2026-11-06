import { Trans, useLingui } from "@lingui/react/macro";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "~/components/ui/context-menu";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import type { TestSummary } from "~/lib/views";

/**
 * The admin's menu of one test (a grammar test or a reading set), on a right click (a long press on touch) on its row, the `children`: rename it, in a
 * dialog with its title, or delete it, after asking. Both change the test for every user.
 */
export function TestMenu({ test, children }: { test: Pick<TestSummary, "id" | "title">; children: React.ReactNode }) {
  const { t } = useLingui();
  const fetcher = useFetcher();
  const [open, setOpen] = useState<"rename" | "delete" | null>(null);
  const close = (isOpen: boolean) => !isOpen && setOpen(null);
  const title = test.title;
  const action = `/api/tests/${test.id}`;
  return (
    <>
      {/* Not modal, so a dialog can open as the menu closes. */}
      <ContextMenu modal={false}>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => setOpen("rename")}>
            <Pencil aria-hidden="true" />
            {t`Rename`}
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" onSelect={() => setOpen("delete")}>
            <Trash2 aria-hidden="true" />
            {t`Delete`}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={open === "rename"} onOpenChange={close}>
        {/* Its Cancel button closes it, so no untranslated ✕. */}
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              <Trans>Rename the test</Trans>
            </DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const renamed = String(new FormData(event.currentTarget).get("title")).trim();
              if (renamed !== title) fetcher.submit({ title: renamed }, { method: "patch", action, encType: "application/json" });
              setOpen(null);
            }}
          >
            <input name="title" aria-label={t`Test name`} required maxLength={60} defaultValue={title} autoFocus className={INPUT_CLASS} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  <Trans>Cancel</Trans>
                </Button>
              </DialogClose>
              <Button type="submit">
                <Trans>Save</Trans>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        title={t`Delete “${title}”?`}
        description={t`The test and every user's results and notes on it will be deleted. This can't be undone.`}
        confirmLabel={t`Delete`}
        onConfirm={() => fetcher.submit(null, { method: "delete", action })}
        open={open === "delete"}
        onOpenChange={close}
      />
    </>
  );
}
