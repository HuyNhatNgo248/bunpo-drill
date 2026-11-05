import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { render, screen, within } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import type { JlptLevel } from "~/lib/levels";
import { TabsLayout } from "./TabsLayout";

/**
 * The layout at `path`, over a page whose loader gives `level`, as the grammar, kanji and notes loaders do; `levels` as
 * the grammar and kanji pages say they have levels.
 */
function renderLayout(path: string, level: JlptLevel | null, levels = false) {
  const page = { path, Component: () => <p>The page</p>, loader: () => ({ level }), handle: { levels } };
  const Stub = createRoutesStub([{ Component: TabsLayout, HydrateFallback: () => null, children: [page] }]);
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
    expect(tabs().getByRole("link", { name: /Notes/ })).toHaveAttribute("aria-current", "page");
    expect(tabs().getByRole("link", { name: /Grammar/ })).toHaveAttribute("href", "/?level=N2");
    expect(tabs().getByRole("link", { name: /Kanji/ })).toHaveAttribute("href", "/kanji?level=N2");
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

  it("links to every JLPT level on a page of levels, easiest first, and marks the one shown", async () => {
    renderLayout("/kanji", "N2", true);

    const nav = within(await screen.findByRole("navigation", { name: "Level" }));
    expect(nav.getAllByRole("link").map((link) => link.textContent)).toEqual(["N5", "N4", "N3", "N2", "N1"]);
    expect(nav.getByRole("link", { name: "N5" })).toHaveAttribute("href", "/kanji?level=N5");
    expect(nav.getByRole("link", { name: "N2" })).toHaveAttribute("aria-current", "page");
  });

  it("has no level links on the notes", async () => {
    renderLayout("/notes", "N2");
    expect(await screen.findByText("The page")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Level" })).toBeNull();
  });

  it("has no level links before the grammar page has a level", async () => {
    renderLayout("/", null, true);

    expect(await screen.findByText("The page")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Level" })).toBeNull();
  });
});
