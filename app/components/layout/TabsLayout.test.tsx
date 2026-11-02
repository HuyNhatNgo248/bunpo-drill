import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { render, screen, within } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import type { JlptLevel } from "~/lib/levels";
import { TabsLayout } from "./TabsLayout";

/** The layout at `path`, over a page whose loader gives `level`, as the grammar, kanji and notes loaders do. */
function renderLayout(path: string, level: JlptLevel | null) {
  const Stub = createRoutesStub([
    { Component: TabsLayout, HydrateFallback: () => null, children: [{ path, Component: () => <p>The page</p>, loader: () => ({ level }) }] },
  ]);
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
});
