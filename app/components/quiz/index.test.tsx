import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { Quiz } from ".";

const QUIZ = buildQuizView({ title: "第1週 1日目" });

const URL = `/tests/${QUIZ.id}`;

/** The quiz page, with the route action that its submit reaches. */
function renderQuiz(error?: string) {
  const { action, requests } = recordingAction();
  renderRoute(<Quiz quiz={QUIZ} error={error} />, { url: URL, action });
  return requests;
}

/** The quiz page alone, for a test that leaves it and opens it again. */
const renderRouteOfQuiz = () => renderRoute(<Quiz quiz={QUIZ} />, { url: URL });

/** Picks the choice named `choice` of question `num`. */
async function pick(num: number, choice: string) {
  const group = await screen.findByRole("radiogroup", { name: `Choices for question ${num}` });
  await userEvent.click(within(group).getByRole("radio", { name: new RegExp(choice) }));
}

/** Taps the pieces of q2 in the order that answers it right: 毎日 練習した かいが あって. */
async function orderPieces() {
  for (const piece of ["毎日", "練習した", "かいが", "あって"]) {
    await userEvent.click(screen.getByRole("button", { name: piece }));
  }
}

const submitButton = () => screen.getByRole("button", { name: "Submit" });

describe("Quiz", () => {
  it("shows each section with its instruction and its questions", async () => {
    renderQuiz();

    expect(await screen.findByRole("heading", { name: "Part 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Part 2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Part 3" })).toBeInTheDocument();
    // Testing Library joins the two ideographic spaces of the blank into one, so the prompt is matched by pattern.
    expect(screen.getByText(/^練習した（\s+）、合格できた。$/)).toBeInTheDocument();
    expect(screen.getByText("Answered 0 / 3")).toBeInTheDocument();
  });

  describe("answering", () => {
    it("counts a picked choice, and marks its number in the question list", async () => {
      renderQuiz();

      await pick(1, "かいがあって");

      expect(screen.getByText("Answered 1 / 3")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Question 1 (answered)" }).length).toBeGreaterThan(0);
    });

    it("counts a sentence-order question once all 4 slots are filled", async () => {
      renderQuiz();
      await screen.findByRole("heading", { name: "Part 2" });

      await orderPieces();

      expect(screen.getByText("Answered 1 / 3")).toBeInTheDocument();
    });

    it("writes the picked choice into the blank of the passage", async () => {
      renderQuiz();

      await pick(3, "かいがあって");

      expect(screen.getByText("（3）かいがあって")).toBeInTheDocument();
    });

    it("clears every answer", async () => {
      renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(screen.getByRole("button", { name: /Clear answers/ }));

      expect(screen.getByText("Answered 0 / 3")).toBeInTheDocument();
    });
  });

  describe("leaving before submitting", () => {
    it("keeps the answers, so the test goes on where it was left when it is opened again", async () => {
      const { unmount } = renderRouteOfQuiz();
      await pick(1, "かいがあって");
      unmount();

      renderQuiz();

      expect(await screen.findByText("Answered 1 / 3")).toBeInTheDocument();
      expect(within(screen.getByRole("radiogroup", { name: "Choices for question 1" })).getByRole("radio", { name: /かいがあって/ })).toBeChecked();
    });

    it("forgets the answers that were cleared", async () => {
      const { unmount } = renderRouteOfQuiz();
      await pick(1, "かいがあって");
      await userEvent.click(screen.getByRole("button", { name: /Clear answers/ }));
      unmount();

      renderQuiz();

      expect(await screen.findByText("Answered 0 / 3")).toBeInTheDocument();
    });
  });

  describe("submitting", () => {
    it("asks first while questions are left, then sends the answers", async () => {
      const requests = renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(submitButton());
      const dialog = screen.getByRole("alertdialog", { name: "2 questions are unanswered. Submit anyway?" });
      await userEvent.click(within(dialog).getByRole("button", { name: "Submit" }));

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: URL, body: { answers: { q1: 2 } } }]));
    });

    it("keeps the answers when the learner goes back to the questions", async () => {
      const requests = renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(submitButton());
      await userEvent.click(screen.getByRole("button", { name: "Keep answering" }));

      expect(requests).toEqual([]);
      expect(screen.getByText("Answered 1 / 3")).toBeInTheDocument();
    });

    it("sends at once when every question is answered", async () => {
      const requests = renderQuiz();
      await pick(1, "かいがあって");
      await orderPieces();
      await pick(3, "かいがあって");

      await userEvent.click(submitButton());

      expect(screen.queryByRole("alertdialog")).toBeNull();
      await waitFor(() => expect(requests[0]?.body).toEqual({ answers: { q1: 2, q2: [1, 0, 2, 3], q3: 0 } }));
    });

    it("shows the error of a submit that failed", async () => {
      renderQuiz("Your answers couldn't be read. Please try again.");

      expect(await screen.findByRole("alert")).toHaveTextContent("Your answers couldn't be read.");
    });
  });
});
