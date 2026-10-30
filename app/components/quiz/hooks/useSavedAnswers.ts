import { useEffect, useState } from "react";
import type { Answers } from "~/lib/views";
import { loadAnswers, loadChecks, saveAnswers, saveChecks, type CheckedSections } from "../helpers/savedAnswers";

/**
 * The answer sheet, saved in this browser on every change and loaded again when the test is reopened.
 * The server renders an empty sheet; the saved one loads after hydration.
 */
export const useSavedAnswers = (testId: string) => useSaved<Answers>(testId, loadAnswers, saveAnswers);

/** The parts checked so far, kept the same way as the sheet. */
export const useSavedChecks = (testId: string) => useSaved<CheckedSections>(testId, loadChecks, saveChecks);

function useSaved<T extends object>(testId: string, load: (testId: string) => T, save: (testId: string, value: T) => void) {
  const [value, setValue] = useState<T>({} as T);
  // Saving waits for the load, so the empty first value cannot overwrite the saved one.
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    setValue(load(testId));
    setLoadedId(testId);
  }, [testId, load]);

  useEffect(() => {
    if (loadedId === testId) save(testId, value);
  }, [testId, loadedId, value, save]);

  return [value, setValue] as const;
}
