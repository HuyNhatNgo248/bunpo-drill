import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import type { JlptLevel } from "~/lib/payload";
import { pageItems } from "./helpers/pageItems";

/** Links to the pages of a level's tests, with the previous and next ones either side. Nothing for one page. */
export function PageLinks({ level, page, pages }: { level: JlptLevel; page: number; pages: number }) {
  if (pages <= 1) return null;
  const href = (to: number) => (to === 1 ? `?level=${level}` : `?level=${level}&page=${to}`);
  return (
    <Pagination>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious to={href(page - 1)} />
          </PaginationItem>
        )}
        {pageItems(page, pages).map((item, index) => (
          <PaginationItem key={index}>
            {item === "…" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink to={href(item)} isActive={item === page}>
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        {page < pages && (
          <PaginationItem>
            <PaginationNext to={href(page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
