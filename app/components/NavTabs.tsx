import { Link } from "react-router";
import { TabHighlight } from "~/components/TabHighlight";
import { cn } from "~/lib/utils";

const VARIANTS = {
  /** A segmented control: the tabs in a sunken box, the one shown raised on a paper card. The subjects. */
  segment: {
    box: "rounded-xl border bg-muted p-1",
    highlight: "rounded-lg bg-card shadow-piece",
    tab: "h-8.5 rounded-lg px-6 text-base",
  },
};

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
  variant,
  className,
}: {
  label: string;
  tabs: readonly { key: string; to: string; label: string }[];
  current: string | undefined;
  shown: string | undefined;
  variant: keyof typeof VARIANTS;
  className?: string;
}) {
  const style = VARIANTS[variant];
  return (
    <nav aria-label={label} className={cn(style.box, className)}>
      <div className="relative grid auto-cols-fr grid-flow-col">
        <TabHighlight index={tabs.findIndex((tab) => tab.key === shown)} count={tabs.length} className={style.highlight} />
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            aria-current={tab.key === current ? "page" : undefined}
            // The page shown again would load it again, for nothing.
            onClick={(event) => tab.key === current && event.preventDefault()}
            className={cn(
              "flex items-center justify-center font-semibold whitespace-nowrap no-underline outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/40",
              style.tab,
              tab.key === shown ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {/* Over the sliding highlight. */}
            <span className="relative">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
