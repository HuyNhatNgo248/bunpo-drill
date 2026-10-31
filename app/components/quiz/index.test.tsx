import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { buildKanjiQuizView, buildQuizView } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute, type StubRoute } from "#tests/helpers/render";
import { gradeTest } from "~/lib/grading.server";
import { Quiz } from ".";

const QUIZ = buildQuizView({ title: "第1週 1日目" });

const URL = `/tests/${QUIZ.id}`;

/** The server's check of one part: it grades the answers it gets against the payload of QUIZ. */
const CHECK_ROUTE: StubRoute = {
  path: "/tests/:id/check",
  action: async ({ request }) => {
    const { section, answers } = await request.json();
    return { section: gradeTest(buildPayload(), answers).sections[section - 1] };
  },
};

/** The quiz page, with the route action that its submit reaches. */
function renderQuiz(error?: string) {
  const { action, requests } = recordingAction();
  renderRoute(<Quiz quiz={QUIZ} error={error} />, { url: URL, action, routes: [CHECK_ROUTE] });
  return requests;
}

/** The quiz page alone, for a test that leaves it and opens it again. */
const renderRouteOfQuiz = () => renderRoute(<Quiz quiz={QUIZ} />, { url: URL, routes: [CHECK_ROUTE] });

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

/** Checks part `no` and confirms the dialog, then waits for the part's score. */
async function checkPart(no: number, score: string) {
  await userEvent.click(await screen.findByRole("button", { name: `Check Part ${no}` }));
  await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Check" }));
  await screen.findByText(score);
}

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

  it("links back to the mock tests", async () => {
    renderQuiz();

    expect(await screen.findByRole("link", { name: "← Mock tests" })).toHaveAttribute("href", "/");
  });

  describe("a kanji test", () => {
    it("shows its 漢字読み and 表記 parts, each sentence with its word underlined, and links back to kanji", async () => {
      renderRoute(<Quiz quiz={buildKanjiQuizView()} />, { url: URL });

      expect(await screen.findByText("漢字読み")).toBeInTheDocument();
      expect(screen.getByText("Choose the best way to write the underlined word in kanji from 1, 2, 3 and 4.")).toBeInTheDocument();
      expect(screen.getByText("招待状", { selector: "u" })).toBeInTheDocument();
      expect(screen.getByText("しょうたいじょう", { selector: "u" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "← Kanji" })).toHaveAttribute("href", "/kanji?level=N2");
    });
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

    it("says on the question list's button how many are left, until all are answered", async () => {
      renderQuiz();
      const listButton = async () => screen.findByRole("button", { name: /Question list/ });

      expect(await listButton()).toHaveTextContent("3 unanswered");
      await pick(1, "かいがあって");
      await orderPieces();
      await pick(3, "かいがあって");
      expect(await listButton()).toHaveTextContent("All answered");
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

  describe("checking a part", () => {
    it("asks first, then shows the part graded with its score, and locks its answers", async () => {
      renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(screen.getByRole("button", { name: "Check Part 1" }));
      const dialog = screen.getByRole("alertdialog", { name: "Check Part 1?" });
      await userEvent.click(within(dialog).getByRole("button", { name: "Check" }));

      expect(await screen.findByText("1 / 1")).toBeInTheDocument();
      expect(screen.getByText(/^Answer: .*かいがあって/)).toBeInTheDocument();
      expect(screen.queryByRole("radiogroup", { name: "Choices for question 1" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Check Part 1" })).toBeNull();
      expect(screen.getByRole("radiogroup", { name: "Choices for question 3" })).toBeInTheDocument();
    });

    it("says how many questions of the part are unanswered, and checks nothing when the learner goes back", async () => {
      renderQuiz();

      await userEvent.click(await screen.findByRole("button", { name: "Check Part 2" }));
      await userEvent.click(within(screen.getByRole("alertdialog", { name: "1 question in this part is unanswered. Check anyway?" })).getByRole("button", { name: "Keep answering" }));

      expect(screen.getByRole("button", { name: "Check Part 2" })).toBeInTheDocument();
    });

    it("keeps the checked part when the test is opened again", async () => {
      const { unmount } = renderRouteOfQuiz();
      await pick(1, "かいがあって");
      await checkPart(1, "1 / 1");
      unmount();

      renderQuiz();

      expect(await screen.findByText("1 / 1")).toBeInTheDocument();
      expect(screen.queryByRole("radiogroup", { name: "Choices for question 1" })).toBeNull();
    });

    it("keeps the answers of a checked part when the rest are cleared, and sends them with the whole test", async () => {
      const requests = renderQuiz();
      await pick(1, "かいがあって");
      await checkPart(1, "1 / 1");
      await pick(3, "かいがあって");

      await userEvent.click(screen.getByRole("button", { name: /Clear answers/ }));
      await userEvent.click(submitButton());
      await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Submit" }));

      expect(screen.getByText("Answered 1 / 3")).toBeInTheDocument();
      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: URL, body: { answers: { q1: 2 } } }]));
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
