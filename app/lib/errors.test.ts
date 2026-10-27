import { UNSAFE_ErrorResponseImpl as ErrorResponse } from "react-router";
import { describe, expect, it } from "vitest";
import { describeError, testNotFound } from "./errors";

/**
 * What React Router gives the error page when a loader throws `data(…, { status })`.
 * `testNotFound` throws one with the data "Test not found".
 */
const routeError = (status: number, data: unknown = null) => new ErrorResponse(status, "", data);

describe("testNotFound", () => {
  it("answers 404 with the data that marks a missing test", () => {
    const thrown = testNotFound();

    expect(thrown.init?.status).toBe(404);
    expect(thrown.data).toBe("Test not found");
  });
});

describe("describeError", () => {
  it("says the test is missing, with no retry, for a missing test", () => {
    expect(describeError(routeError(404, testNotFound().data))).toEqual({
      status: 404,
      kanji: "無",
      title: "テストが見つかりません",
      description: "このテストは存在しないか、削除された可能性があります。",
      retry: false,
    });
  });

  it("says the page is missing for any other 404", () => {
    expect(describeError(routeError(404))).toEqual({
      status: 404,
      kanji: "無",
      title: "ページが見つかりません",
      retry: false,
    });
  });

  it("reports a failure and offers a retry for a 5xx answer", () => {
    expect(describeError(routeError(503))).toEqual({
      status: 503,
      kanji: "障",
      title: "システム障害が発生しました",
      description: "ページを読み込めませんでした。しばらくしてから、もう一度お試しください。",
      retry: true,
    });
  });

  it("reports a refused request with no retry for a 4xx answer other than 404", () => {
    // The same request gets the same answer again, so a retry does not help.
    expect(describeError(routeError(400))).toMatchObject({
      status: 400,
      description: "リクエストを処理できませんでした。",
      retry: false,
    });
  });

  it("treats a thrown Error, which has no status, as a 500", () => {
    expect(describeError(new Error("boom"))).toMatchObject({ status: 500, kanji: "障", retry: true });
  });
});
