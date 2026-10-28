import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("keeps the light text of a red button at the small size, whose font size is the theme's text-caption", () => {
    render(<Button size="sm">アカウントを作成</Button>);

    expect(screen.getByRole("button")).toHaveClass("bg-primary", "text-primary-foreground", "text-caption");
  });

  it("keeps the light text when it wraps a link", () => {
    render(
      <Button asChild size="sm">
        <a href="/signup">アカウントを作成</a>
      </Button>,
    );

    expect(screen.getByRole("link")).toHaveClass("text-primary-foreground");
  });
});
