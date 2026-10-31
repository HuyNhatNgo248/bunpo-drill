import { createCn } from "cn/config";

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
