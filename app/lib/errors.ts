import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { data, isRouteErrorResponse } from "react-router";

const TEST_NOT_FOUND = "Test not found";
const CHAPTER_NOT_FOUND = "Chapter not found";

/** What loaders and actions throw for a test id that isn't saved. */
export const testNotFound = () => data(TEST_NOT_FOUND, { status: 404 });

/** What loaders and actions throw for a kanji chapter whose words haven't been sent. */
export const chapterNotFound = () => data(CHAPTER_NOT_FOUND, { status: 404 });

export type ErrorCopy = {
  status: number;
  /** One kanji for the tile in every language, the way 文 marks the brand: 無 for missing, 障 (障害) for a failure. */
  kanji: string;
  title: MessageDescriptor;
  description?: MessageDescriptor;
  /** Offer "Reload": a failure may not happen a second time. */
  retry: boolean;
};

/** The error page's words, for the page and its title to translate: a missing test, a missing page, or something that broke. */
export function describeError(error: unknown): ErrorCopy {
  if (isRouteErrorResponse(error) && error.status === 404) {
    if (error.data === TEST_NOT_FOUND) {
      return {
        status: 404,
        kanji: "無",
        title: msg`Test not found`,
        description: msg`This test doesn't exist, or it may have been deleted.`,
        retry: false,
      };
    }
    if (error.data === CHAPTER_NOT_FOUND) {
      return {
        status: 404,
        kanji: "無",
        title: msg`Chapter not found`,
        description: msg`This chapter's words haven't been sent yet. Ask Claude for them with /jlpt-kanji-quiz.`,
        retry: false,
      };
    }
    return { status: 404, kanji: "無", title: msg`Page not found`, retry: false };
  }
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return {
    status,
    kanji: "障",
    title: msg`Something went wrong`,
    description:
      status >= 500 ? msg`The page couldn't load. Please try again in a moment.` : msg`The request couldn't be handled.`,
    retry: status >= 500,
  };
}
