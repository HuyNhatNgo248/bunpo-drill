import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import { BackLink } from "./BackLink";

describe("BackLink", () => {
  it("links back to the mock tests", async () => {
    renderRoute(<BackLink />);

    expect(await screen.findByRole("link", { name: "← Mock tests" })).toHaveAttribute("href", "/");
  });
});
