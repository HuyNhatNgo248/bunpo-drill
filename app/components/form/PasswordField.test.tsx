import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordField } from "./PasswordField";
import { renderWithCatalog } from "#tests/helpers/render";

const field = () => screen.getByLabelText<HTMLInputElement>("Password");

const eyeButton = (name: RegExp) => screen.getByRole("button", { name });

describe("PasswordField", () => {
  it("hides what is typed, behind its label", () => {
    renderWithCatalog(<PasswordField label="Password" name="password" />);

    expect(field().type).toBe("password");
    expect(field().name).toBe("password");
  });

  it("shows the password on the eye button, and hides it again", async () => {
    renderWithCatalog(<PasswordField label="Password" name="password" />);

    await userEvent.click(eyeButton(/^Show /));

    expect(field().type).toBe("text");
    expect(eyeButton(/^Hide /)).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(eyeButton(/^Hide /));

    expect(field().type).toBe("password");
  });

  it("keeps the button name out of the field name, so a screen reader reads the field by its label alone", () => {
    renderWithCatalog(<PasswordField label="Password" name="password" />);

    expect(field()).toHaveAccessibleName("Password");
  });

  it("shows a hint under the field", () => {
    renderWithCatalog(<PasswordField label="Password" hint="At least 8 characters" name="password" />);

    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
  });
});
