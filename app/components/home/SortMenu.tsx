import { useLingui } from "@lingui/react/macro";
import { ArrowDownUp, Check, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import type { JlptLevel } from "~/lib/payload";

/** The order of the tests: from week 1, or the latest week first. Each choice is a link to the list in that order. */
export function SortMenu({ level, latestFirst }: { level: JlptLevel; latestFirst: boolean }) {
  const { t } = useLingui();
  const orders = [
    { latest: false, label: t`From week 1` },
    { latest: true, label: t`Latest week first` },
  ];
  const current = orders.find((order) => order.latest === latestFirst)!.label;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={t`Sort: ${current}`}>
            <ArrowDownUp aria-hidden="true" />
            {current}
            <ChevronDown aria-hidden="true" className="opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {orders.map(({ latest, label }) => (
            <DropdownMenuItem key={label} asChild>
              <Link to={latest ? `?level=${level}&sort=latest` : `?level=${level}`} aria-current={latest === latestFirst ? "true" : undefined}>
                {label}
                {latest === latestFirst && <Check aria-hidden="true" className="ml-auto" />}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
