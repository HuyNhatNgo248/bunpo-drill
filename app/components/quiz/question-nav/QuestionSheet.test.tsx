import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import { ANSWER_MARKS, answeredMarks } from "./QuestionGrid";
import { QuestionSheet } from "./QuestionSheet";
import { renderWithCatalog } from "#tests/helpers/render";

const SECTIONS = buildQuizView().sections;

/** The sheet of a quiz with q1 answered, in the words the quiz gives it. */
const renderSheet = () =>
  renderWithCatalog(
    <QuestionSheet
      sections={SECTIONS}
      markOf={answeredMarks(new Set(["q1"]))}
      marks={ANSWER_MARKS}
      status="2 unanswered"
      summary="Answered 1 / 3"
    />,
  );

const openButton = () => screen.getByRole("button", { name: /Question list/ });

describe("QuestionSheet", () => {
  it("says the status on its button", () => {
    renderSheet();

    expect(openButton()).toHaveTextContent("Question list· 2 unanswered");
  });

  it("opens the question list with the summary, each number in its mark", async () => {
    renderSheet();

    await userEvent.click(openButton());

    const sheet = screen.getByRole("dialog", { name: "Question list" });
    expect(sheet).toHaveTextContent("Answered 1 / 3");
    expect(screen.getByRole("button", { name: "Question 1 (answered)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Question 2 (unanswered)" })).toBeInTheDocument();
  });

  it("closes when a number is picked", async () => {
    renderSheet();
    await userEvent.click(openButton());

    await userEvent.click(screen.getByRole("button", { name: "Question 2 (unanswered)" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
