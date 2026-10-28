import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import { LanguageSwitch } from "./LanguageSwitch";

describe("LanguageSwitch", () => {
  it("names the language of the page", async () => {
    renderRoute(<LanguageSwitch />);

    expect(await screen.findByRole("button", { name: "Language: English" })).toBeInTheDocument();
  });

  it("offers each language in itself, with a check on the one in use", async () => {
    renderRoute(<LanguageSwitch />);

    await userEvent.click(await screen.findByRole("button", { name: "Language: English" }));

    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "English" }).querySelector("svg")).not.toBeNull();
    expect(within(menu).getByRole("menuitem", { name: "日本語" })).toHaveAttribute("lang", "ja");
  });

  it("sends the language and the page to /locale, which reloads the page", async () => {
    renderRoute(<LanguageSwitch />, { url: "/tests/20261027-abc123?level=N2" });
    await userEvent.click(await screen.findByRole("button", { name: "Language: English" }));

    const japanese = within(screen.getByRole("menu")).getByRole("menuitem", { name: "日本語" });
    const form = document.getElementById(japanese.getAttribute("form")!) as HTMLFormElement;
    expect(form).toHaveAttribute("action", "/locale");
    expect(form).toHaveAttribute("method", "post");
    expect(japanese).toHaveAttribute("name", "locale");
    expect(japanese).toHaveAttribute("value", "ja");
    expect(new FormData(form).get("redirectTo")).toBe("/tests/20261027-abc123?level=N2");
  });
});
