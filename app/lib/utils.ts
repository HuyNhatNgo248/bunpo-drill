import { createCn } from "cn/config";
import type { ShouldRevalidateFunction } from "react-router";

/**
 * Merges class names, the last of two conflicting Tailwind classes winning. It knows the theme's own
 * scales (tailwind.css), so `text-caption` counts as a font size and does not replace a colour such as
 * `text-primary-foreground`, and `border-b-line` (a width) survives `border-faint`.
 */
export const cn = createCn({
  extend: {
    theme: {
      text: ["2xs", "caption", "body-sm", "prompt", "title", "title-lg", "tile", "score", "hero"],
      leading: ["sentence", "passage"],
      radius: ["box"],
      shadow: ["float", "raised", "piece"],
    },
    classGroups: { "border-w": [{ border: ["line"] }], "border-w-b": [{ "border-b": ["line"] }] },
  },
});

/**
 * A route's shouldRevalidate for a page that shows the `param` picked by itself (a week, a chapter): picking one doesn't
 * load the page again; any other change of the address, or a form sent, does.
 */
export const revalidateUnlessPicked =
  (param: string): ShouldRevalidateFunction =>
  ({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }) => {
    const without = (url: URL) => {
      const params = new URLSearchParams(url.search);
      params.delete(param);
      return `${url.pathname}?${params}`;
    };
    const picked = currentUrl.search !== nextUrl.search;
    return !formMethod && picked && without(currentUrl) === without(nextUrl) ? false : defaultShouldRevalidate;
  };

/**
 * Seconds as a clock reads them, minutes and seconds.
 *
 * @example
 * clock(227); // -> "3:47"
 */
export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
