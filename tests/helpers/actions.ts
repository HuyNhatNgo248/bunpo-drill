/** One request that a recording action got. `path` keeps its query, if any. */
export type RecordedRequest = { method: string; path: string; body: unknown };

/**
 * A route action that keeps every request it gets, so a test can check what a form or a fetcher sent.
 * A JSON body is parsed; a form body becomes an object of its fields; no body is null.
 *
 * @example
 * const { action, requests } = recordingAction();
 * // … click the button …
 * await waitFor(() => expect(requests).toEqual([{ method: "POST", path: "/tests/1/retake", body: null }]));
 */
export function recordingAction() {
  const requests: RecordedRequest[] = [];
  const action = async ({ request }: { request: Request }) => {
    const text = await request.text();
    const json = request.headers.get("Content-Type")?.includes("json");
    const body = !text ? null : json ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text));
    const url = new URL(request.url);
    requests.push({ method: request.method, path: url.pathname + url.search, body });
    return null;
  };
  return { action, requests };
}
