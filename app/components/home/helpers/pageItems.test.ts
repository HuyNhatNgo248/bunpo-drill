import { describe, expect, it } from "vitest";
import { pageItems } from "./pageItems";

describe("pageItems", () => {
  it("shows every page when there are few", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows the first, the current and the last page, with a gap of one page shown rather than skipped", () => {
    expect(pageItems(1, 10)).toEqual([1, "…", 10]);
    expect(pageItems(3, 10)).toEqual([1, 2, 3, "…", 10]);
    expect(pageItems(5, 10)).toEqual([1, "…", 5, "…", 10]);
    expect(pageItems(9, 10)).toEqual([1, "…", 9, 10]);
  });
});
