import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import type { ErrorCopy } from "~/lib/errors";
import { ErrorPage } from "./ErrorPage";

const MISSING_TEST: ErrorCopy = {
  status: 404,
  kanji: "無",
  title: "テストが見つかりません",
  description: "このテストは存在しないか、削除された可能性があります。",
  retry: false,
};

const FAILURE: ErrorCopy = { status: 500, kanji: "障", title: "システム障害が発生しました", retry: true };

describe("ErrorPage", () => {
  it("shows the status, the title and the description, with a way home", async () => {
    renderRoute(<ErrorPage copy={MISSING_TEST} />);

    expect(await screen.findByRole("heading", { name: "テストが見つかりません" })).toBeInTheDocument();
    expect(screen.getByText("エラー 404")).toBeInTheDocument();
    expect(screen.getByText(MISSING_TEST.description!)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "テスト一覧に戻る" })).toHaveAttribute("href", "/");
  });

  it("offers no reload for an error that a reload does not fix", async () => {
    renderRoute(<ErrorPage copy={MISSING_TEST} />);
    await screen.findByRole("heading");

    expect(screen.queryByRole("button", { name: "再読み込み" })).toBeNull();
  });

  it("offers a reload for a failure", async () => {
    renderRoute(<ErrorPage copy={FAILURE} />);

    expect(await screen.findByRole("button", { name: "再読み込み" })).toBeInTheDocument();
  });
});
