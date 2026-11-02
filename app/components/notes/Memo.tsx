import { Trans, useLingui } from "@lingui/react/macro";
import { TEXTAREA_CLASS } from "~/components/form/styles";
import { Markdown } from "~/components/Markdown";

/**
 * A note's memo: drawn from its Markdown, or "Add a memo" when there is none, or, while `editing`, a text box. Leaving
 * the box closes it with what it holds, ⌘/Ctrl+Enter too, and Escape closes it as it was.
 */
export function Memo({
  memo,
  text,
  editing,
  onEdit,
  onClose,
}: {
  memo: string;
  text: string;
  editing: boolean;
  onEdit: () => void;
  onClose: (memo: string) => void;
}) {
  const { t } = useLingui();

  if (editing) {
    return (
      <>
        <textarea
          aria-label={t`Memo`}
          // Opened by a click on Edit, to type in.
          autoFocus
          defaultValue={memo}
          maxLength={2000}
          placeholder={t`Reading or meaning`}
          className={TEXTAREA_CLASS}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.value = memo;
            if (event.key === "Escape" || (event.key === "Enter" && (event.metaKey || event.ctrlKey))) event.currentTarget.blur();
          }}
          onBlur={(event) => onClose(event.currentTarget.value.trim())}
        />
      </>
    );
  }
  return memo ? (
    <div className="text-sm">
      <Markdown text={memo} />
    </div>
  ) : (
    <button
      type="button"
      aria-label={t`Add a memo to ${text}`}
      className="self-start text-sm text-muted-foreground hover:text-foreground"
      onClick={onEdit}
    >
      <Trans>Add a memo</Trans>
    </button>
  );
}
