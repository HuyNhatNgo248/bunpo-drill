/**
 * A ref callback that keeps --passage-h on the passage's box equal to the passage's height,
 * for its questions' scroll margin.
 */
export function trackPassageHeight(card: HTMLElement) {
  const box = card.parentElement!;
  const observer = new ResizeObserver(() => box.style.setProperty("--passage-h", `${card.offsetHeight}px`));
  observer.observe(card);
  return () => observer.disconnect();
}
