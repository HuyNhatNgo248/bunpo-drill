import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordField } from "./PasswordField";

const field = () => screen.getByLabelText<HTMLInputElement>("パスワード");

const eyeButton = (name: RegExp) => screen.getByRole("button", { name });

describe("PasswordField", () => {
  it("hides what is typed, behind its label", () => {
    render(<PasswordField label="パスワード" name="password" />);

    expect(field().type).toBe("password");
    expect(field().name).toBe("password");
  });

  it("shows the password on the eye button, and hides it again", async () => {
    render(<PasswordField label="パスワード" name="password" />);

    await userEvent.click(eyeButton(/を表示$/));

    expect(field().type).toBe("text");
    expect(eyeButton(/を隠す$/)).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(eyeButton(/を隠す$/));

    expect(field().type).toBe("password");
  });

  it("keeps the button name out of the field name, so a screen reader reads the field by its label alone", () => {
    render(<PasswordField label="パスワード" name="password" />);

    expect(field()).toHaveAccessibleName("パスワード");
  });

  it("shows a hint under the field", () => {
    render(<PasswordField label="パスワード" hint="8文字以上" name="password" />);

    expect(screen.getByText("8文字以上")).toBeInTheDocument();
  });
});
