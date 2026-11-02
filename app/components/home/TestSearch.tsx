import { useLingui } from "@lingui/react/macro";
import { Search, X } from "lucide-react";
import { INPUT_CLASS } from "~/components/form/styles";
import { cn } from "~/lib/utils";

/** The search over the tests' titles and grammar, which filters the list as it is typed; ✕ or Escape clears it. */
export function TestSearch({ query, onChange }: { query: string; onChange: (query: string) => void }) {
  const { t } = useLingui();
  return (
    <div className="relative flex-1 md:w-80 md:flex-none">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        role="searchbox"
        enterKeyHint="search"
        value={query}
        aria-label={t`Search the tests`}
        placeholder={t`Test name or grammar`}
        className={cn(INPUT_CLASS, "w-full px-9 md:h-9")}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && onChange("")}
      />
      {query && (
        <button
          type="button"
          aria-label={t`Clear the search`}
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => onChange("")}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
