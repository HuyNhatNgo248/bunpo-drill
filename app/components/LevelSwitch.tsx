import { useLingui } from "@lingui/react/macro";
import { Check, ChevronDown } from "lucide-react";
import { Link, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import type { JlptLevel } from "~/lib/payload";
import { cn } from "~/lib/utils";

/**
 * Switches a page (the mock tests, kanji, reading) between the JLPT levels: a button with the level, which opens a menu of
 * every level. The level is in the URL, so a reload keeps it. The button shows the level picked before its page loads.
 * `disabled` on a page that isn't split by level (the notes): the button stays, greyed, so the tabs beside it don't move.
 */
export function LevelSwitch({
  levels,
  current,
  disabled = false,
  className,
}: {
  levels: readonly JlptLevel[];
  current: JlptLevel;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useLingui();
  const next = new URLSearchParams(useNavigation().location?.search).get("level");
  const shown = levels.find((level) => level === next) ?? current;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant="outline" aria-label={t`Level: ${shown}`} className={cn("gap-2 px-3.5 text-base font-semibold", className)}>
          {shown}
          <ChevronDown aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {levels.map((level) => (
          <DropdownMenuItem key={level} asChild>
            {/* No prefetch: the loader saves the last level, so a hover would save a level never opened. */}
            <Link to={`?level=${level}`} aria-current={level === current ? "page" : undefined} className={cn("font-semibold no-underline", level === current && "bg-primary-soft text-primary-soft-foreground")}>
              {level}
              {level === current && <Check aria-hidden="true" className="ml-auto text-primary" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
