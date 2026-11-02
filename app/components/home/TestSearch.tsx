import { useLingui } from "@lingui/react/macro";
import { Search, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * The bar over the test list: a search over the tests' titles and grammar, which filters the list as it is typed, and
 * after a line the controls given as `children` (the sort menu). ✕ or Escape clears the search; / anywhere on the page
 * (outside a text box) jumps into it, as its hint says on a desktop.
 */
export function TestSearch({ query, onChange, children }: { query: string; onChange: (query: string) => void; children?: ReactNode }) {
  const { t } = useLingui();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    // The border of a text box, darker than the cards' around it, so it reads as one.
    <div className="flex h-12 items-center rounded-xl border border-input bg-card shadow-piece transition-shadow focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/40">
      {/* A click anywhere on the search half lands in the box. */}
      <label className="flex min-w-0 flex-1 cursor-text items-center gap-2.5 self-stretch pr-2 pl-3.5 text-subtle-foreground">
        <Search aria-hidden="true" className="size-4 shrink-0" />
        <input
          ref={input}
          role="searchbox"
          enterKeyHint="search"
          value={query}
          aria-label={t`Search the tests`}
          placeholder={t`Test name or grammar`}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-subtle-foreground"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => event.key === "Escape" && onChange("")}
        />
        {query ? (
          <button
            type="button"
            aria-label={t`Clear the search`}
            className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-muted hover:text-foreground"
            onClick={() => onChange("")}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <kbd aria-hidden="true" className="hidden h-5 items-center rounded-sm border border-b-2 bg-background px-1.5 font-sans text-2xs md:inline-flex">
            /
          </kbd>
        )}
      </label>
      {children && (
        <>
          <div aria-hidden="true" className="my-2.5 w-px self-stretch bg-border" />
          <div className="shrink-0 px-1.5">{children}</div>
        </>
      )}
    </div>
  );
}
