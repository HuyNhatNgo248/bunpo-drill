import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { renderWithCatalog } from "#tests/helpers/render";

/** The dialog behind a delete button, the way the home page uses it. */
function renderDialog(props: { cancelLabel?: string } = {}) {
  const onConfirm = vi.fn();
  renderWithCatalog(
    <ConfirmDialog title="削除しますか？" description="この操作は取り消せません。" confirmLabel="Delete" onConfirm={onConfirm} {...props}>
      <button type="button">ゴミ箱</button>
    </ConfirmDialog>,
  );
  return onConfirm;
}

const openDialog = () => userEvent.click(screen.getByRole("button", { name: "ゴミ箱" }));

describe("ConfirmDialog", () => {
  it("asks first, and runs the action only on the confirm button", async () => {
    const onConfirm = renderDialog();

    await openDialog();

    expect(screen.getByRole("alertdialog", { name: "削除しますか？" })).toHaveTextContent("この操作は取り消せません。");
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("closes without the action on cancel", async () => {
    const onConfirm = renderDialog();
    await openDialog();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("takes another label for the cancel button", async () => {
    renderDialog({ cancelLabel: "Keep answering" });

    await openDialog();

    expect(screen.getByRole("button", { name: "Keep answering" })).toBeInTheDocument();
  });
});
