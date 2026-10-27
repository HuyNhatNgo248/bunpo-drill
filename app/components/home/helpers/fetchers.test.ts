import { describe, expect, it } from "vitest";
import { deletingIds } from "./fetchers";

describe("deletingIds", () => {
  it("collects the ids that the DELETE fetchers of single tests send to", () => {
    const fetchers = [
      { formMethod: "DELETE", formAction: "/api/tests/20261027-abc123" },
      { formMethod: "DELETE", formAction: "/api/tests/20261027-def456" },
    ];

    expect(deletingIds(fetchers)).toEqual(new Set(["20261027-abc123", "20261027-def456"]));
  });

  it("skips the fetchers that delete nothing, and the clear-all", () => {
    const fetchers = [
      { formMethod: "PATCH", formAction: "/api/tests/20261027-abc123" },
      { formMethod: "DELETE", formAction: "/api/tests" },
      {},
    ];

    expect(deletingIds(fetchers)).toEqual(new Set());
  });
});
