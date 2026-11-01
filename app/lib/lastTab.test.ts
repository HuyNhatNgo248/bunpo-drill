import { describe, expect, it } from "vitest";
import { tabFromCookie } from "./lastTab";

describe("tabFromCookie", () => {
  it("reads the subject and the level of the tab cookie, among the others", () => {
    expect(tabFromCookie("lang=ja; tab=kanji:N2")).toEqual({ subject: "kanji", level: "N2" });
    expect(tabFromCookie("tab=grammar:N5")).toEqual({ subject: "grammar", level: "N5" });
  });

  it("gives null for no cookie, and for one that names no known subject or level", () => {
    for (const cookie of [null, "", "lang=ja", "tab=reading:N2", "tab=kanji:N6", "tab=kanji", "tab=grammar:"]) {
      expect(tabFromCookie(cookie)).toBeNull();
    }
  });
});
