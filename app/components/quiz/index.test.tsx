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

/** Picks the choice named `choice` of question `num`. */
async function pick(num: number, choice: string) {
  const group = await screen.findByRole("radiogroup", { name: `問題 ${num} の選択肢` });
  await userEvent.click(within(group).getByRole("radio", { name: new RegExp(choice) }));
}

/** Taps the pieces of q2 in the order that answers it right: 毎日 練習した かいが あって. */
async function orderPieces() {
  for (const piece of ["毎日", "練習した", "かいが", "あって"]) {
    await userEvent.click(screen.getByRole("button", { name: piece }));
  }
}

const submitButton = () => screen.getByRole("button", { name: "提出する" });

describe("Quiz", () => {
  it("shows each section with its instruction and its questions", async () => {
    renderQuiz();

    expect(await screen.findByRole("heading", { name: "問題1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "問題2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "問題3" })).toBeInTheDocument();
    // Testing Library joins the two ideographic spaces of the blank into one, so the prompt is matched by pattern.
    expect(screen.getByText(/^練習した（\s+）、合格できた。$/)).toBeInTheDocument();
    expect(screen.getByText("回答済み 0 / 3")).toBeInTheDocument();
  });

  describe("answering", () => {
    it("counts a picked choice, and marks its number in the question list", async () => {
      renderQuiz();

      await pick(1, "かいがあって");

      expect(screen.getByText("回答済み 1 / 3")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "問題1（回答済み）" }).length).toBeGreaterThan(0);
    });

    it("counts a sentence-order question once all 4 slots are filled", async () => {
      renderQuiz();
      await screen.findByRole("heading", { name: "問題2" });

      await orderPieces();

      expect(screen.getByText("回答済み 1 / 3")).toBeInTheDocument();
    });

    it("writes the picked choice into the blank of the passage", async () => {
      renderQuiz();

      await pick(3, "かいがあって");

      expect(screen.getByText("（3）かいがあって")).toBeInTheDocument();
    });

    it("clears every answer", async () => {
      renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(screen.getByRole("button", { name: /回答をクリア/ }));

      expect(screen.getByText("回答済み 0 / 3")).toBeInTheDocument();
    });
  });

  describe("submitting", () => {
    it("asks first while questions are left, then sends the answers", async () => {
      const requests = renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(submitButton());
      const dialog = screen.getByRole("alertdialog", { name: "未回答が2問あります。提出しますか？" });
      await userEvent.click(within(dialog).getByRole("button", { name: "提出する" }));

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: URL, body: { answers: { q1: 2 } } }]));
    });

    it("keeps the answers when the learner goes back to the questions", async () => {
      const requests = renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(submitButton());
      await userEvent.click(screen.getByRole("button", { name: "解答を続ける" }));

      expect(requests).toEqual([]);
      expect(screen.getByText("回答済み 1 / 3")).toBeInTheDocument();
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
      renderQuiz("回答を読み取れませんでした。もう一度お試しください。");

      expect(await screen.findByRole("alert")).toHaveTextContent("回答を読み取れませんでした。");
    });
  });
});
