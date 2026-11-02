import { Trans, useLingui } from "@lingui/react/macro";
import { NotebookPen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { selectedNote, type SelectedNote } from "./helpers/selectedNote";

/**
 * Words selected in a sentence of the page (inside an element with `data-note-sentence`) can go to the user's notes,
 * from a popover under them: first a button, then the words with a memo to fill in or not. Once they are added the
 * popover closes, and the page's notes, loaded again, highlight them; a click elsewhere closes it too.
 */
export function AddNote({ testId }: { testId: string }) {
  const { t } = useLingui();
  const [picked, setPicked] = useState<SelectedNote | null>(null);
  const [stage, setStage] = useState<"offer" | "form" | "sent">("offer");
  const fetcher = useFetcher<{ added?: boolean }>();
  // The range itself, so the popover follows the words as the page scrolls.
  const anchor = useMemo(() => ({ current: picked?.range ?? null }), [picked]);

  useEffect(() => {
    // While the memo is typed, the selection is in its field, and the words stay picked.
    if (stage === "form") return;
    const onChange = () => {
      const next = selectedNote(document.getSelection());
      // A selection that ends (as a click on the button ends it) keeps the popover; a click elsewhere closes it.
      if (!next) return;
      setPicked(next);
      setStage("offer");
    };
    document.addEventListener("selectionchange", onChange);
    return () => document.removeEventListener("selectionchange", onChange);
  }, [stage]);

  const added = stage === "sent" && fetcher.state === "idle" && fetcher.data?.added === true;

  const close = () => {
    setPicked(null);
    setStage("offer");
  };
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!picked) return;
    const memo = String(new FormData(event.currentTarget).get("memo") ?? "");
    const { text, sentence, anchor } = picked;
    fetcher.submit({ text, sentence, anchor, testId, memo }, { method: "post", action: "/notes", encType: "application/json" });
    document.getSelection()?.removeAllRanges();
    setStage("sent");
  };

  return (
    <Popover open={picked !== null && !added} onOpenChange={(open) => !open && close()}>
      <PopoverAnchor virtualRef={anchor} />
      <PopoverContent
        side="bottom"
        align="start"
        // Moving the focus would end the selection on a phone.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className={cn(stage !== "form" && "w-auto p-1")}
      >
        {stage === "offer" && (
          <Button variant="ghost" size="sm" onClick={() => setStage("form")}>
            <NotebookPen aria-hidden="true" />
            <Trans>Add to notes</Trans>
          </Button>
        )}
        {stage === "form" && picked && (
          <form onSubmit={save} className="flex flex-col gap-2.5">
            <p lang="ja" className="font-jp text-base font-semibold">
              {picked.text}
            </p>
            <label className="flex flex-col gap-1 text-caption text-muted-foreground">
              <Trans>Memo (optional)</Trans>
              <input name="memo" maxLength={500} placeholder={t`Reading or meaning`} className={INPUT_CLASS} />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={close}>
                <Trans>Cancel</Trans>
              </Button>
              <Button type="submit" size="sm">
                <Trans>Save</Trans>
              </Button>
            </div>
          </form>
        )}
        {stage === "sent" && (
          <p role="status" className="px-2 py-1.5 text-caption">
            {fetcher.state !== "idle" ? (
              <Trans>Adding…</Trans>
            ) : fetcher.data?.added === false ? (
              <Trans>Already in your notes.</Trans>
            ) : (
              <Trans>Couldn't add it. Please try again.</Trans>
            )}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
