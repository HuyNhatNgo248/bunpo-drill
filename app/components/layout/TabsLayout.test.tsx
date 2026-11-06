import userEvent from "@testing-library/user-event";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { render, screen, within } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import type { JlptLevel } from "~/lib/levels";
import { PATHS } from "./tabCache";
import { TabsLayout } from "./TabsLayout";

/**
 * The layout at `path`, over a page whose loader gives `level`, as the grammar, kanji and notes loaders do; `levels` as
 * the grammar and kanji pages say they have levels.
 */
function renderLayout(path: string, level: JlptLevel | null, levels = false) {
  const page = { path, Component: () => <p>The page</p>, loader: () => ({ level }), handle: { levels } };
  // The other tabs, which the layout loads in the background.
  const others = Object.values(PATHS)
    .filter((other) => other !== path)
    .map((other) => (other === PATHS.grammar ? { index: true, loader: () => ({}) } : { path: other, loader: () => ({}) }));
  const Stub = createRoutesStub([{ Component: TabsLayout, HydrateFallback: () => null, children: [page, ...others] }]);
  render(
    <I18nProvider i18n={i18n}>
      <Stub initialEntries={[path]} />
    </I18nProvider>,
  );
}

/** The tab links, by name. */
const tabs = () => within(screen.getByRole("navigation", { name: "Subject" }));

describe("TabsLayout", () => {
  it("draws the header and the tabs over the page, the page's tab current, its level kept in the others", async () => {
    renderLayout("/notes", "N2");

    expect(await screen.findByText("The page")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    // The notes are a link of their own, beside the subjects; on a phone they are in the tab bar with them.
    expect(screen.getAllByRole("link", { name: /Notes/ }).map((link) => link.getAttribute("aria-current"))).toEqual(["page", "page"]);
    expect(tabs().getByRole("link", { name: /Grammar/ })).toHaveAttribute("href", "/?level=N2");
    expect(tabs().getByRole("link", { name: /Kanji/ })).toHaveAttribute("href", "/kanji?level=N2");
    const bar = within(screen.getByRole("navigation", { name: "Sections" }));
    expect(bar.getAllByRole("link").map((link) => link.textContent)).toEqual(["Grammar", "Kanji", "Reading", "Notes"]);
    expect(bar.getByRole("link", { name: /Reading/ })).toHaveAttribute("href", "/reading?level=N2");
  });

  it("marks the kanji tab on the kanji page", async () => {
    renderLayout("/kanji", "N3");

    expect(await screen.findByText("The page")).toBeInTheDocument();
    expect(tabs().getByRole("link", { name: /Kanji/ })).toHaveAttribute("aria-current", "page");
    expect(tabs().getByRole("link", { name: /Grammar/ })).toHaveAttribute("href", "/?level=N3");
  });

  it("links the tabs without a level when the page has none", async () => {
    renderLayout("/", null);

    expect(await screen.findByText("The page")).toBeInTheDocument();
    expect(tabs().getByRole("link", { name: /Grammar/ })).toHaveAttribute("aria-current", "page");
    expect(tabs().getByRole("link", { name: /Kanji/ })).toHaveAttribute("href", "/kanji");
  });

  it("shows the level on a page of levels, and a menu of every JLPT level, easiest first, the one shown marked", async () => {
    renderLayout("/kanji", "N2", true);

    await userEvent.click(await screen.findByRole("button", { name: "Level: N2" }));

    const menu = within(await screen.findByRole("menu", { name: "Level: N2" }));
    expect(menu.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["N5", "N4", "N3", "N2", "N1"]);
    expect(menu.getByRole("menuitem", { name: "N5" })).toHaveAttribute("href", "/kanji?level=N5");
    expect(menu.getByRole("menuitem", { name: "N2" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the level switch on the notes, greyed, so the tabs don't move", async () => {
    renderLayout("/notes", "N2");
    expect(await screen.findByRole("button", { name: "Level: N2" })).toBeDisabled();
  });

  it("has no level links before the grammar page has a level", async () => {
    renderLayout("/", null, true);

    expect(await screen.findByText("The page")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Level/ })).toBeNull();
  });
});
