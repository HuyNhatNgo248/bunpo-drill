import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import { InfoLink } from "./InfoLink";

describe("InfoLink", () => {
  it("links to the subject's info page", async () => {
    renderRoute(<InfoLink subject="reading" />);

    expect(await screen.findByRole("link", { name: "What's on the test" })).toHaveAttribute("href", "/info/reading");
  });
});
