import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import { QuestionSheet } from "./QuestionSheet";
import { renderWithCatalog } from "#tests/helpers/render";

const SECTIONS = buildQuizView().sections;

const openButton = () => screen.getByRole("button", { name: /Question list/ });

describe("QuestionSheet", () => {
  it("says on its button how many questions are left", () => {
    renderWithCatalog(<QuestionSheet sections={SECTIONS} answered={new Set(["q1"])} remaining={2} />);

    expect(openButton()).toHaveTextContent("2 unanswered");
  });

  it("says that every question is answered when none is left", () => {
    renderWithCatalog(<QuestionSheet sections={SECTIONS} answered={new Set(["q1", "q2", "q3"])} remaining={0} />);

    expect(openButton()).toHaveTextContent("All answered");
  });

  it("opens the question list with the answered count", async () => {
    renderWithCatalog(<QuestionSheet sections={SECTIONS} answered={new Set(["q1"])} remaining={2} />);

    await userEvent.click(openButton());

    const sheet = screen.getByRole("dialog", { name: "Question list" });
    expect(sheet).toHaveTextContent("Answered 1 / 3");
    expect(screen.getByRole("button", { name: "Question 1 (answered)" })).toBeInTheDocument();
  });

  it("closes when a number is picked", async () => {
    renderWithCatalog(<QuestionSheet sections={SECTIONS} answered={new Set()} remaining={3} />);
    await userEvent.click(openButton());

    await userEvent.click(screen.getByRole("button", { name: "Question 2 (unanswered)" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
