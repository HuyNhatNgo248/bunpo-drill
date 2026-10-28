import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import { msg } from "@lingui/core/macro";
import type { ErrorCopy } from "~/lib/errors";
import { ErrorPage } from "./ErrorPage";

const MISSING_TEST: ErrorCopy = {
  status: 404,
  kanji: "無",
  title: msg`Test not found`,
  description: msg`This test doesn't exist, or it may have been deleted.`,
  retry: false,
};

const FAILURE: ErrorCopy = { status: 500, kanji: "障", title: msg`Something went wrong`, retry: true };

describe("ErrorPage", () => {
  it("shows the status, the title and the description, with a way home", async () => {
    renderRoute(<ErrorPage copy={MISSING_TEST} />);

    expect(await screen.findByRole("heading", { name: "Test not found" })).toBeInTheDocument();
    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(screen.getByText("This test doesn't exist, or it may have been deleted.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the mock tests" })).toHaveAttribute("href", "/");
  });

  it("offers no reload for an error that a reload does not fix", async () => {
    renderRoute(<ErrorPage copy={MISSING_TEST} />);
    await screen.findByRole("heading");

    expect(screen.queryByRole("button", { name: "Reload" })).toBeNull();
  });

  it("offers a reload for a failure", async () => {
    renderRoute(<ErrorPage copy={FAILURE} />);

    expect(await screen.findByRole("button", { name: "Reload" })).toBeInTheDocument();
  });
});
