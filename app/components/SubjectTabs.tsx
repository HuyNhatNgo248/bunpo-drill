import { useLingui } from "@lingui/react/macro";
import { Link, useNavigation } from "react-router";
import { cn } from "~/lib/utils";
import type { TestKind } from "~/lib/views";

/**
 * Switches between the grammar mock tests and kanji. A page that is not Japanese adds the Japanese word to each tab.
 * Like the level tabs, one highlight slides to the subject picked, as soon as it is picked.
 */
export function SubjectTabs({ current }: { current: TestKind }) {
  const { t, i18n } = useLingui();
  const tabs = [
    { kind: "grammar", to: "/", label: t`Grammar`, ja: "文法" },
    { kind: "kanji", to: "/kanji", label: t`Kanji`, ja: "漢字" },
  ] as const;
  const next = useNavigation().location?.pathname;
  const shown = tabs.find((tab) => tab.to === next)?.kind ?? current;
  return (
    <nav aria-label={t`Subject`} className="w-full rounded-lg border bg-card p-1 md:w-80">
      <div className="relative grid grid-cols-2">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/2 rounded-md bg-primary-soft transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${tabs.findIndex((tab) => tab.kind === shown) * 100}%)` }}
        />
        {tabs.map(({ kind, to, label, ja }) => (
          <Link
            key={kind}
            to={to}
            aria-current={kind === current ? "page" : undefined}
            className={cn(
              "relative flex h-9 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-semibold no-underline outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/40",
              kind === shown ? "text-primary-soft-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {i18n.locale !== "ja" && (
              <span lang="ja" className="font-jp font-medium">
                {ja}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
