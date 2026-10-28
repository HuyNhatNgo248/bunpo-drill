import { UNSAFE_ErrorResponseImpl as ErrorResponse } from "react-router";
import { i18n } from "@lingui/core";
import { describe, expect, it } from "vitest";
import { describeError, testNotFound } from "./errors";

/**
 * What React Router gives the error page when a loader throws `data(…, { status })`.
 * `testNotFound` throws one with the data "Test not found".
 */
const routeError = (status: number, data: unknown = null) => new ErrorResponse(status, "", data);

/** The copy with its title and description in English, the way the error page shows them. */
function wordsOf(error: unknown) {
  const { title, description, ...rest } = describeError(error);
  return { ...rest, title: i18n._(title), ...(description && { description: i18n._(description) }) };
}

describe("testNotFound", () => {
  it("answers 404 with the data that marks a missing test", () => {
    const thrown = testNotFound();

    expect(thrown.init?.status).toBe(404);
    expect(thrown.data).toBe("Test not found");
  });
});

describe("describeError", () => {
  it("says the test is missing, with no retry, for a missing test", () => {
    expect(wordsOf(routeError(404, testNotFound().data))).toEqual({
      status: 404,
      kanji: "無",
      title: "Test not found",
      description: "This test doesn't exist, or it may have been deleted.",
      retry: false,
    });
  });

  it("says the page is missing for any other 404", () => {
    expect(wordsOf(routeError(404))).toEqual({
      status: 404,
      kanji: "無",
      title: "Page not found",
      retry: false,
    });
  });

  it("reports a failure and offers a retry for a 5xx answer", () => {
    expect(wordsOf(routeError(503))).toEqual({
      status: 503,
      kanji: "障",
      title: "Something went wrong",
      description: "The page couldn't load. Please try again in a moment.",
      retry: true,
    });
  });

  it("reports a refused request with no retry for a 4xx answer other than 404", () => {
    // The same request gets the same answer again, so a retry does not help.
    expect(wordsOf(routeError(400))).toMatchObject({
      status: 400,
      description: "The request couldn't be handled.",
      retry: false,
    });
  });

  it("treats a thrown Error, which has no status, as a 500", () => {
    expect(describeError(new Error("boom"))).toMatchObject({ status: 500, kanji: "障", retry: true });
  });
});
