import { useLingui } from "@lingui/react/macro";
import { ArrowDownUp, Check, ChevronDown } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import type { JlptLevel } from "~/lib/payload";

/**
 * The order of the tests: from week 1, or the latest week first. Each choice is a link to the list in that order, the
 * search kept. It sits at the end of the search bar; on a phone it is only its icon.
 */
export function SortMenu({ level, latestFirst }: { level: JlptLevel; latestFirst: boolean }) {
  const { t } = useLingui();
  const query = useSearchParams()[0].get("q");
  const hrefOf = (latest: boolean) => {
    const params = new URLSearchParams({ level });
    if (latest) params.set("sort", "latest");
    if (query) params.set("q", query);
    return `?${params}`;
  };
  const orders = [
    { latest: false, label: t`From week 1` },
    { latest: true, label: t`Latest week first` },
  ];
  const current = orders.find((order) => order.latest === latestFirst)!.label;

  return (
    <div className="flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={t`Sort: ${current}`}>
            <ArrowDownUp aria-hidden="true" />
            <span className="hidden md:inline">{current}</span>
            <ChevronDown aria-hidden="true" className="hidden opacity-60 md:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {orders.map(({ latest, label }) => (
            <DropdownMenuItem key={label} asChild>
              <Link to={hrefOf(latest)} aria-current={latest === latestFirst ? "true" : undefined}>
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
