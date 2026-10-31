import type { ReactNode } from "react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";

/**
 * Desktop: the title of a test, results or flashcards page. A line with the level, a word about the page and the way
 * back at the right, then the heading.
 */
export function PageTitle({
  level,
  meta,
  back,
  children,
}: {
  level: string;
  meta: ReactNode;
  back?: { to: string; label: ReactNode };
  children: ReactNode;
}) {
  return (
    <div className="hidden flex-col gap-2 md:flex">
      <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
        <Badge>{level}</Badge>
        <span>{meta}</span>
        {back && (
          <Link to={back.to} className="ml-auto text-subtle-foreground no-underline hover:text-foreground">
            {back.label}
          </Link>
        )}
      </div>
      <h1 className="text-title font-bold tracking-tight">{children}</h1>
    </div>
  );
}
