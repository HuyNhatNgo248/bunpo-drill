import { useLingui } from "@lingui/react/macro";
import { Link, useLocation, useNavigation } from "react-router";
import { cn } from "~/lib/utils";
import type { JlptLevel } from "~/lib/payload";

/** The pages the tabs switch between. */
const PATHS = { grammar: "/", kanji: "/kanji", notes: "/notes" } as const;

/**
 * True while a tab's page loads, another level of the same one included: the page shown fades, so the click shows at
 * once.
 */
export function useTabLoading(): boolean {
  const navigation = useNavigation();
  return navigation.state === "loading" && Object.values(PATHS).some((path) => path === navigation.location.pathname);
}

/**
 * Switches between the grammar mock tests, kanji and the notes, the tab of the page shown being the current one, at
 * the level picked on the page (notes have none). Like
 * the level tabs, one highlight slides to the subject picked, as soon as it is picked; TabsLayout keeps the tabs on
 * screen while the page changes, so the slide is never cut short.
 */
export function SubjectTabs({ level }: { level: JlptLevel | null }) {
  const { t } = useLingui();
  const tabs = [
    { kind: "grammar", path: PATHS.grammar, label: t`Grammar` },
    { kind: "kanji", path: PATHS.kanji, label: t`Kanji` },
    { kind: "notes", path: PATHS.notes, label: t`Notes` },
  ] as const;
  const here = useLocation().pathname;
  const current = tabs.find((tab) => tab.path === here)?.kind;
  const next = useNavigation().location?.pathname;
  const shown = tabs.find((tab) => tab.path === next)?.kind ?? current;
  return (
    <nav aria-label={t`Subject`} className="w-full rounded-lg border bg-card p-1 md:w-96">
      <div className="relative grid grid-cols-3">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/3 rounded-md bg-primary-soft transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${tabs.findIndex((tab) => tab.kind === shown) * 100}%)` }}
        />
        {tabs.map(({ kind, path, label }) => (
          <Link
            key={kind}
            to={level && kind !== "notes" ? `${path}?level=${level}` : path}
            // No prefetch: the loader saves the last tab, so a hover would save a tab never opened.
            aria-current={kind === current ? "page" : undefined}
            className={cn(
              // Not positioned, so its hover background is under the sliding highlight; only its words are over it.
              "flex h-9 items-center justify-center rounded-md px-2 text-sm font-semibold no-underline outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/40 md:px-4",
              kind === shown ? "text-primary-soft-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="relative">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
