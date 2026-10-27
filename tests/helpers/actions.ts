/** One request that a recording action got. */
export type RecordedRequest = { method: string; path: string; body: unknown };

/**
 * A route action that keeps every request it gets, so a test can check what a form or a fetcher sent.
 * A JSON body is parsed; a form body becomes an object of its fields; no body is null.
 *
 * @example
 * const { action, requests } = recordingAction();
 * // … click the button …
 * await waitFor(() => expect(requests).toEqual([{ method: "DELETE", path: "/api/tests", body: null }]));
 */
export function recordingAction() {
  const requests: RecordedRequest[] = [];
  const action = async ({ request }: { request: Request }) => {
    const text = await request.text();
    const json = request.headers.get("Content-Type")?.includes("json");
    const body = !text ? null : json ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text));
    requests.push({ method: request.method, path: new URL(request.url).pathname, body });
    return null;
  };
  return { action, requests };
}
