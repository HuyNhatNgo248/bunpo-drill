import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps a colour next to one of the theme's own font sizes", () => {
    expect(cn("text-primary-foreground", "text-caption")).toBe("text-primary-foreground text-caption");
  });

  it("lets a theme font size replace another font size", () => {
    expect(cn("text-sm", "text-caption")).toBe("text-caption");
  });

  it("keeps the theme's border width next to a border colour", () => {
    expect(cn("border-b-line", "border-faint")).toBe("border-b-line border-faint");
  });
});
