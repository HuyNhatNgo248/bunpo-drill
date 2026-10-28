import { useEffect, useState } from "react";
import type { Answers } from "~/lib/views";
import { loadAnswers, saveAnswers } from "../helpers/savedAnswers";

/**
 * The answer sheet, saved in this browser on every change and loaded again when the test is reopened.
 * The server renders an empty sheet; the saved one loads after hydration.
 */
export function useSavedAnswers(testId: string) {
  const [answers, setAnswers] = useState<Answers>({});
  // Saving waits for the load, so the empty first sheet cannot overwrite the saved one.
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    setAnswers(loadAnswers(testId));
    setLoadedId(testId);
  }, [testId]);

  useEffect(() => {
    if (loadedId === testId) saveAnswers(testId, answers);
  }, [testId, loadedId, answers]);

  return [answers, setAnswers] as const;
}
