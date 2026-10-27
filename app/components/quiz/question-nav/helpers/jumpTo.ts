import { questionAnchor } from "~/lib/sections";

/** Scrolls to question `num` and focuses its card. */
export function jumpTo(num: number) {
  const card = document.getElementById(questionAnchor(num));
  if (!card) return;
  // Jump instantly: a smooth scroll across 45 questions takes over a second.
  card.scrollIntoView({ behavior: "instant", block: "start" });
  card.focus({ preventScroll: true });
}
