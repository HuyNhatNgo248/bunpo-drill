import { describe, expect, it } from "vitest";
import { localeCookie, localeFromCookie, localeFromMatches } from "./locale";

describe("localeFromCookie", () => {
  it("reads the language among the other cookies", () => {
    expect(localeFromCookie("session=abc; lang=ja; theme=dark")).toBe("ja");
  });

  it("gives English without the cookie, or with a language the app does not have", () => {
    expect(localeFromCookie(null)).toBe("en");
    expect(localeFromCookie("session=abc")).toBe("en");
    expect(localeFromCookie("lang=fr")).toBe("en");
  });
});

describe("localeCookie", () => {
  it("keeps the language for a year, on every page", () => {
    expect(localeCookie("ja")).toBe("lang=ja; Path=/; Max-Age=31536000; SameSite=Lax");
  });
});

describe("localeFromMatches", () => {
  it("reads the language that the root loader gives", () => {
    expect(localeFromMatches([{ id: "root", loaderData: { locale: "ja" } }, { id: "routes/home" }])).toBe("ja");
  });

  it("gives English when the root has no language, as on an error before the root loader ran", () => {
    expect(localeFromMatches([{ id: "root" }])).toBe("en");
    expect(localeFromMatches([])).toBe("en");
  });
});
