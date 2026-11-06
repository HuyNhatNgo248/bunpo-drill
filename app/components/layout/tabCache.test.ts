import { afterEach, describe, expect, it, vi } from "vitest";
import { clearTabCache, tabClientLoader } from "./tabCache";

/** Runs the clientLoader for `href` while the browser shows `here`, with a server that answers `answer`. */
async function load(href: string, here: string, answer: object) {
  window.history.replaceState(null, "", here);
  const serverLoader = vi.fn(async () => answer);
  const data = await tabClientLoader({ request: new Request(new URL(href, window.location.origin)), serverLoader });
  return { data, asked: serverLoader.mock.calls.length };
}

afterEach(() => {
  clearTabCache();
  vi.useRealTimers();
});

describe("tabClientLoader", () => {
  it("asks the server the first time, then shows the cached data from another tab", async () => {
    expect(await load("/kanji?level=N2", "/?level=N2", { n: 1 })).toEqual({ data: { n: 1 }, asked: 1 });
    expect(await load("/kanji?level=N2", "/reading?level=N2", { n: 2 })).toEqual({ data: { n: 1 }, asked: 0 });
  });

  it("marks old data stale, so the page asks the server after showing it", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    await load("/kanji?level=N2", "/", { n: 1 });
    vi.setSystemTime(Date.now() + 60_000);

    expect(await load("/kanji?level=N2", "/", { n: 2 })).toEqual({ data: { n: 1, stale: true }, asked: 0 });
  });

  it("asks the server when coming from a page out of the tabs, which may have changed the data", async () => {
    await load("/kanji?level=N2", "/", { n: 1 });

    expect(await load("/kanji?level=N2", "/kanji/N2/1/cards", { n: 2 })).toEqual({ data: { n: 2 }, asked: 1 });
  });

  it("asks the server for the page shown now, as after a save", async () => {
    await load("/kanji?level=N2", "/", { n: 1 });

    expect(await load("/kanji?level=N2", "/kanji?level=N2", { n: 2 })).toEqual({ data: { n: 2 }, asked: 1 });
  });

  it("keys a prefetch without its mark, and asks the server only for a tab not cached", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    expect(await load("/kanji?level=N2&prefetch=", "/", { n: 1 })).toEqual({ data: { n: 1 }, asked: 1 });
    vi.setSystemTime(Date.now() + 60_000);

    // React Router runs a prefetch again on every reload: old data is enough, as the click refreshes it.
    expect(await load("/kanji?level=N2&prefetch=", "/", { n: 2 })).toEqual({ data: { n: 1 }, asked: 0 });
    expect(await load("/kanji?level=N2", "/", { n: 3 })).toEqual({ data: { n: 1, stale: true }, asked: 0 });
  });

  it("gives a prefetch that React Router runs again after the click the data the page just got", async () => {
    await load("/kanji?level=N2", "/", { n: 1 });

    expect(await load("/kanji?level=N2&prefetch=", "/kanji?level=N2", { n: 2 })).toEqual({ data: { n: 1 }, asked: 0 });
  });

  it("keeps a failed prefetch from the page, but not a failed page load", async () => {
    window.history.replaceState(null, "", "/");
    const serverLoader = async (): Promise<object> => {
      throw new Error("offline");
    };
    const request = (href: string) => new Request(new URL(href, window.location.origin));

    await expect(tabClientLoader({ request: request("/kanji?prefetch="), serverLoader })).resolves.toEqual({});
    await expect(tabClientLoader({ request: request("/kanji"), serverLoader })).rejects.toThrow("offline");
  });
});
