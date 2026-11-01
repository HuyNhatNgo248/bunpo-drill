import { describe, expect, it } from "vitest";
import { rowHeading } from "./rowHeading";

describe("rowHeading", () => {
  it("puts the week of a one-week test in the tile, and the days in the title", () => {
    expect(rowHeading("第2週 1〜6日目", [2])).toEqual({ week: "2", title: "1〜6日目" });
  });

  it("keeps the whole title when it is only the week, or does not name it", () => {
    expect(rowHeading("第2週", [2])).toEqual({ week: "2", title: "第2週" });
    expect(rowHeading("苦手な文法", [2])).toEqual({ week: "2", title: "苦手な文法" });
  });

  it("shows two weeks side by side, and more as a range, with the whole title", () => {
    expect(rowHeading("第3週・第5週", [3, 5])).toEqual({ week: "3・5", title: "第3週・第5週" });
    expect(rowHeading("苦手な文法", [1, 3, 4])).toEqual({ week: "1–4", title: "苦手な文法" });
  });

  it("leaves the tile empty for a test with no weeks", () => {
    expect(rowHeading("模試", [])).toEqual({ week: "", title: "模試" });
  });
});
