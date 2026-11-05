import { Link } from "react-router";
import { TabHighlight } from "~/components/TabHighlight";
import { cn } from "~/lib/utils";

const VARIANTS = {
  /** Text tabs, the one shown underlined in the app's red: the subjects, which name the page. */
  underline: {
    highlight: "bg-transparent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
    tab: "h-11 rounded-md px-4 text-base md:h-12 md:px-5 md:text-prompt",
  },
  /** Small tabs, the one shown on a faint ink tint, as the week list marks its week: the levels. */
  tint: {
    highlight: "rounded-md bg-foreground/8",
    tab: "h-9 rounded-md px-3 text-caption md:h-8",
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
    <nav aria-label={label} className={className}>
      <div className="relative grid auto-cols-fr grid-flow-col">
        <TabHighlight index={tabs.findIndex((tab) => tab.key === shown)} count={tabs.length} className={style.highlight} />
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            // No prefetch: the loader saves the last tab, so a hover would save a tab never opened.
            aria-current={tab.key === current ? "page" : undefined}
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
