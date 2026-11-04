import { Link } from "react-router";
import { TabHighlight } from "~/components/TabHighlight";
import { cn } from "~/lib/utils";

/**
 * A row of links as tabs, the one of the page shown (`current`) marked as the current page. One highlight slides to the
 * tab `shown`, the one being opened or else the current one, as soon as it is picked rather than once its page has
 * loaded. The tabs share one width, so the highlight moves by whole tabs with a CSS transition.
 */
export function NavTabs({
  label,
  tabs,
  current,
  shown,
  className,
}: {
  label: string;
  tabs: readonly { key: string; to: string; label: string }[];
  current: string | undefined;
  shown: string | undefined;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("w-full rounded-lg border bg-card p-1", className)}>
      <div className="relative grid auto-cols-fr grid-flow-col">
        <TabHighlight index={tabs.findIndex((tab) => tab.key === shown)} count={tabs.length} />
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            // No prefetch: the loader saves the last tab, so a hover would save a tab never opened.
            aria-current={tab.key === current ? "page" : undefined}
            className={cn(
              // Not positioned, so its hover background is under the sliding highlight; only its words are over it.
              "flex h-9 items-center justify-center rounded-md px-2 text-sm font-semibold no-underline outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/40 md:px-4",
              tab.key === shown ? "text-primary-soft-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="relative">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
