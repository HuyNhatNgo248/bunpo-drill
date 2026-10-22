import { data, isRouteErrorResponse } from "react-router";

const TEST_NOT_FOUND = "Test not found";

/** What loaders and actions throw for a test id that isn't saved. */
export const testNotFound = () => data(TEST_NOT_FOUND, { status: 404 });

export type ErrorCopy = {
  status: number;
  /** One kanji for the tile, the way 文 marks the brand: 無 for missing, 障 (障害) for a failure. */
  kanji: string;
  title: string;
  description?: string;
  /** Offer "再読み込み": a failure may not happen a second time. */
  retry: boolean;
};

/** The error page's words, all in Japanese: a missing test, a missing page, or something that broke. */
export function describeError(error: unknown): ErrorCopy {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return error.data === TEST_NOT_FOUND
      ? {
          status: 404,
          kanji: "無",
          title: "テストが見つかりません",
          description: "このテストは存在しないか、削除された可能性があります。",
          retry: false,
        }
      : { status: 404, kanji: "無", title: "ページが見つかりません", retry: false };
  }
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return {
    status,
    kanji: "障",
    title: "システム障害が発生しました",
    description:
      status >= 500
        ? "ページを読み込めませんでした。しばらくしてから、もう一度お試しください。"
        : "リクエストを処理できませんでした。",
    retry: status >= 500,
  };
}
