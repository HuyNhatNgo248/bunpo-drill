import { useEffect, useRef, useState } from "react";

/** How far down the screen a passage counts as the one being read: a reading line at 40% of its height. */
const READING_LINE = 0.4;

/**
 * Times a reading set's passages: each second the page is in view adds one to the passage being read, the one whose
 * box (data-passage-index, its card and its questions) crosses the reading line, else the last one above it. Starts
 * from the `initial` times of a draft. Off (`count` 0) for a test with no passages to time.
 * Returns the times, and a ref to them for the saves, which read them without waiting for a render.
 */
export function useReadingTimer(count: number, initial: number[] = []) {
  const [times, setTimes] = useState(() => Array.from({ length: count }, (_, i) => initial[i] ?? 0));
  const ref = useRef(times);
  ref.current = times;

  useEffect(() => {
    if (!count) return;
    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const index = currentPassage();
      if (index === null) return;
      setTimes((current) => current.map((seconds, i) => (i === index ? seconds + 1 : seconds)));
    }, 1000);
    return () => clearInterval(tick);
  }, [count]);

  return { times, ref };
}

/** The index of the passage being read, or null when no passage is on the page. */
function currentPassage(): number | null {
  const line = window.innerHeight * READING_LINE;
  let current: number | null = null;
  for (const box of document.querySelectorAll<HTMLElement>("[data-passage-index]")) {
    if (box.getBoundingClientRect().top > line) break;
    current = Number(box.dataset.passageIndex);
  }
  // The page is above the first passage (the title, the instruction): it is the one about to be read.
  const first = document.querySelector<HTMLElement>("[data-passage-index]");
  return current ?? (first ? Number(first.dataset.passageIndex) : null);
}
