import { describe, expect, it } from "vitest";
import { parseTab, tabValue } from "./lastTab";

describe("parseTab", () => {
  it("reads the subject and the level of a saved tab", () => {
    expect(parseTab("kanji:N2")).toEqual({ subject: "kanji", level: "N2" });
    expect(parseTab(tabValue({ subject: "grammar", level: "N5" }))).toEqual({ subject: "grammar", level: "N5" });
    expect(parseTab("reading:N2")).toEqual({ subject: "reading", level: "N2" });
  });

  it("gives null for none, and for a value that names no known subject or level", () => {
    for (const value of [null, undefined, "", "notes:N2", "kanji:N6", "kanji", "grammar:"]) {
      expect(parseTab(value)).toBeNull();
    }
  });
});
