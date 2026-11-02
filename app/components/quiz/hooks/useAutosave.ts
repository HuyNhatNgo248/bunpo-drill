import { useCallback, useEffect, useRef } from "react";
import type { QuizDraft } from "~/lib/views";

/** How long the sheet stays unchanged before it is saved, so a run of taps sends one save. */
const SAVE_DELAY = 800;

/**
 * Saves the quiz's draft on the server (POST /tests/:id/draft) a moment after it changes, and at once when the quiz is
 * left or the page is hidden, so the last answer is kept. A save that fails goes again with the next one.
 * With no `testId` (a trial test), nothing is saved.
 */
export function useAutosave(testId: string | null, { answers, checks, kept }: QuizDraft) {
  const pending = useRef<string | null>(null);
  // The draft the page loaded with is saved already.
  const loaded = useRef(true);

  const flush = useCallback(() => {
    const body = pending.current;
    if (body === null || testId === null) return;
    pending.current = null;
    // keepalive: the request still goes out while the page is left or closed.
    fetch(`/tests/${testId}/draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
      .then((response) => {
        if (!response.ok) throw new Error(`The draft was not saved (${response.status}).`);
      })
      .catch(() => {
        pending.current ??= body;
      });
  }, [testId]);

  useEffect(() => {
    if (loaded.current) {
      loaded.current = false;
      return;
    }
    pending.current = JSON.stringify({ answers, checked: Object.keys(checks).map(Number), kept });
    const timer = setTimeout(flush, SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [answers, checks, kept, flush]);

  useEffect(() => {
    // A phone can close a hidden tab without another event; leaving the quiz inside the app unmounts it.
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [flush]);
}
