import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { buildKanjiQuizView, buildQuizView, buildReadingQuizView } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute, type StubRoute } from "#tests/helpers/render";
import { gradeTest } from "~/lib/grading.server";
import { questionAnchor } from "~/lib/sections";
import type { QuizDraft } from "~/lib/views";
import { Quiz } from ".";

const QUIZ = buildQuizView({ title: "第1週 1日目" });

const URL = `/tests/${QUIZ.id}`;

/** A test not started yet. */
const NO_DRAFT: QuizDraft = { answers: {}, checks: {} };

/** A test left with q1 answered right and Part 1 checked. */
const PART_1_CHECKED: QuizDraft = { answers: { q1: 2 }, checks: { 1: gradeTest(buildPayload(), { q1: 2 }).sections[0] } };

/** The drafts the quiz saved on the server (POST /tests/:id/draft), in order. */
let saved: { path: string; body: unknown }[] = [];

/** The server's check of one part: it grades the answers it gets against the payload of QUIZ. */
const checkAction: StubRoute["action"] = async ({ request }) => {
  const { section, answers } = await request.json();
  return { section: gradeTest(buildPayload(), answers).sections[section - 1] };
};

const CHECK_ROUTE: StubRoute = { path: "/tests/:id/check", action: checkAction };

/** The quiz page, left at `draft`, with the route action that its submit reaches. */
function renderQuiz({ error, draft = NO_DRAFT }: { error?: string; draft?: QuizDraft } = {}) {
  const { action, requests } = recordingAction();
  const { unmount } = renderRoute(<Quiz quiz={QUIZ} draft={draft} error={error} />, { url: URL, action, routes: [CHECK_ROUTE] });
  return { requests, unmount };
}

/** Waits for the saves of the draft, which go a moment after the last change. */
const expectSaved = (bodies: unknown[]) =>
  waitFor(() => expect(saved).toEqual(bodies.map((body) => ({ path: `${URL}/draft`, body }))), { timeout: 2000 });

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

/** Checks part `no` and confirms the dialog, then waits for its summary. */
async function confirmCheck(no: number) {
  await userEvent.click(await screen.findByRole("button", { name: `Check Part ${no}` }));
  await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Check" }));
  return screen.findByRole("alertdialog", { name: `Part ${no} checked` });
}

/** Checks part `no`, closes its summary, and waits for the part's score. */
async function checkPart(no: number, score: string) {
  await userEvent.click(within(await confirmCheck(no)).getByRole("button", { name: "Keep going" }));
  await screen.findByText(score);
}

// The quiz saves its draft with fetch; each test records the saves instead of sending them.
beforeEach(() => {
  saved = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    saved.push({ path: String(url), body: JSON.parse(String(init?.body)) });
    return new Response(null, { status: 204 });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

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
      renderRoute(<Quiz quiz={buildKanjiQuizView()} draft={NO_DRAFT} />, { url: URL });

      expect(await screen.findByText("漢字読み")).toBeInTheDocument();
      expect(screen.getByText("Choose the best way to write the underlined word in kanji from 1, 2, 3 and 4.")).toBeInTheDocument();
      expect(screen.getByText("招待状", { selector: "u" })).toBeInTheDocument();
      expect(screen.getByText("しょうたいじょう", { selector: "u" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "← Kanji" })).toHaveAttribute("href", "/kanji?level=N2&chapter=1");
    });
  });

  describe("a reading set", () => {
    const READING = buildReadingQuizView();

    it("shows its passage with its underline and （注）, its question, and how long the passage has taken", async () => {
      renderRoute(<Quiz quiz={READING} draft={{ ...NO_DRAFT, times: [65] }} />, { url: URL });

      expect(await screen.findByText("内容理解（短文）")).toBeInTheDocument();
      expect(screen.getAllByText("あえてアプリを閉じて歩く").map((text) => text.className)).toEqual([expect.stringContaining("underline"), expect.stringContaining("underline")]);
      expect(screen.getByText("（注）余地：")).toBeInTheDocument();
      expect(screen.getByText("1:05 on it · target 2:00")).toBeInTheDocument();
      expect(screen.getByRole("timer", { name: "Time 1:05, target 2:00" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "← Reading" })).toHaveAttribute("href", "/reading?level=N2&group=1");
    });

    it("sends the time of each passage with the answers", async () => {
      const { action, requests } = recordingAction();
      renderRoute(<Quiz quiz={READING} draft={{ ...NO_DRAFT, times: [65] }} />, { url: URL, action });
      await pick(1, "思いがけない発見");

      await userEvent.click(submitButton());

      await waitFor(() => expect(requests[0]?.body).toEqual({ answers: { q1: 2 }, times: [65] }));
    });

    it("saves its time when it is left, before any answer", async () => {
      const { unmount } = renderRoute(<Quiz quiz={READING} draft={{ ...NO_DRAFT, times: [65] }} />, { url: URL });
      await screen.findByText("内容理解（短文）");

      unmount();

      expect(saved).toEqual([{ path: `${URL}/draft`, body: { answers: {}, checked: [], times: [65] } }]);
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

  });

  describe("saving where it is left", () => {
    it("saves the answers and checked parts on the server a moment after they change", async () => {
      renderQuiz();

      await pick(1, "かいがあって");

      await expectSaved([{ answers: { q1: 2 }, checked: [] }]);
    });

    it("saves at once when the quiz is left", async () => {
      const { unmount } = renderQuiz();
      await pick(1, "かいがあって");

      unmount();

      expect(saved).toEqual([{ path: `${URL}/draft`, body: { answers: { q1: 2 }, checked: [] } }]);
    });

    it("goes on from the draft it was left at, and saves nothing until it changes", async () => {
      renderQuiz({ draft: { answers: { q1: 2 }, checks: {} } });

      expect(await screen.findByText("Answered 1 / 3")).toBeInTheDocument();
      expect(within(screen.getByRole("radiogroup", { name: "Choices for question 1" })).getByRole("radio", { name: /かいがあって/ })).toBeChecked();
      expect(saved).toEqual([]);
    });

    it("carries over a sheet this browser kept before drafts were saved on the server", async () => {
      localStorage.setItem(`bunpo:answers:${QUIZ.id}`, JSON.stringify({ q1: 2 }));

      renderQuiz();

      expect(await screen.findByText("Answered 1 / 3")).toBeInTheDocument();
      await expectSaved([{ answers: { q1: 2 }, checked: [] }]);
    });

    it("keeps the server's draft over a sheet this browser kept", async () => {
      localStorage.setItem(`bunpo:answers:${QUIZ.id}`, JSON.stringify({ q1: 0, q3: 1 }));

      renderQuiz({ draft: { answers: { q1: 2 }, checks: {} } });

      expect(await screen.findByText("Answered 1 / 3")).toBeInTheDocument();
      expect(localStorage.getItem(`bunpo:answers:${QUIZ.id}`)).toBeNull();
    });
  });

  describe("checking a part", () => {
    it("asks first, then shows the part graded with its score, and locks its answers", async () => {
      renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(screen.getByRole("button", { name: "Check Part 1" }));
      const dialog = screen.getByRole("alertdialog", { name: "Check Part 1?" });
      await userEvent.click(within(dialog).getByRole("button", { name: "Check" }));
      await userEvent.click(within(await screen.findByRole("alertdialog", { name: "Part 1 checked" })).getByRole("button", { name: "Keep going" }));

      expect(await screen.findByText("1 / 1")).toBeInTheDocument();
      expect(screen.getByText(/^Answer: .*かいがあって/)).toBeInTheDocument();
      expect(screen.queryByRole("radiogroup", { name: "Choices for question 1" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Check Part 1" })).toBeNull();
      expect(screen.getByRole("radiogroup", { name: "Choices for question 3" })).toBeInTheDocument();
    });

    it("sums up the part in a dialog, and a number picked there jumps to its graded answer", async () => {
      renderQuiz();
      await pick(1, "までして");

      const summary = await confirmCheck(1);

      expect(summary).toHaveTextContent("0 correct · 1 wrong · 0 unanswered");
      await userEvent.click(within(summary).getByRole("button", { name: "Question 1 (wrong)" }));
      expect(screen.queryByRole("alertdialog")).toBeNull();
      await waitFor(() => expect(document.activeElement).toBe(document.getElementById(questionAnchor(1))));
    });

    it("counts a blank question as unanswered in the summary", async () => {
      renderQuiz();

      const summary = await confirmCheck(2);

      expect(summary).toHaveTextContent("0 correct · 0 wrong · 1 unanswered");
      expect(within(summary).getByRole("button", { name: "Question 2 (unanswered)" })).toBeInTheDocument();
    });

    it("says how many questions of the part are unanswered, and checks nothing when the learner goes back", async () => {
      renderQuiz();

      await userEvent.click(await screen.findByRole("button", { name: "Check Part 2" }));
      await userEvent.click(within(screen.getByRole("alertdialog", { name: "1 question in this part is unanswered. Check anyway?" })).getByRole("button", { name: "Keep answering" }));

      expect(screen.getByRole("button", { name: "Check Part 2" })).toBeInTheDocument();
    });

    it("saves the checked part with the answers", async () => {
      renderQuiz();
      await pick(1, "かいがあって");

      await checkPart(1, "1 / 1");

      await waitFor(() => expect(saved.at(-1)?.body).toEqual({ answers: { q1: 2 }, checked: [1] }), { timeout: 2000 });
    });

    it("shows a part checked before graded and locked, with no summary", async () => {
      renderQuiz({ draft: PART_1_CHECKED });

      expect(await screen.findByText("1 / 1")).toBeInTheDocument();
      expect(screen.queryByRole("radiogroup", { name: "Choices for question 1" })).toBeNull();
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("sends the answers of a checked part with the whole test", async () => {
      const { requests } = renderQuiz();
      await pick(1, "かいがあって");
      await checkPart(1, "1 / 1");

      await userEvent.click(submitButton());
      await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Submit" }));

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: URL, body: { answers: { q1: 2 } } }]));
    });

  });

  describe("a trial test", () => {
    it("checks its parts at /try/:id/check, and saves nothing, even when left", async () => {
      const { unmount } = renderRoute(<Quiz quiz={QUIZ} draft={NO_DRAFT} trial />, {
        url: `/try/${QUIZ.id}`,
        routes: [{ path: "/try/:id/check", action: checkAction }],
      });
      await pick(1, "かいがあって");

      await checkPart(1, "1 / 1");
      unmount();

      expect(saved).toEqual([]);
    });
  });

  describe("submitting", () => {
    it("asks first while questions are left, then sends the answers", async () => {
      const { requests } = renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(submitButton());
      const dialog = screen.getByRole("alertdialog", { name: "2 questions are unanswered. Submit anyway?" });
      await userEvent.click(within(dialog).getByRole("button", { name: "Submit" }));

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: URL, body: { answers: { q1: 2 } } }]));
    });

    it("keeps the answers when the learner goes back to the questions", async () => {
      const { requests } = renderQuiz();
      await pick(1, "かいがあって");

      await userEvent.click(submitButton());
      await userEvent.click(screen.getByRole("button", { name: "Keep answering" }));

      expect(requests).toEqual([]);
      expect(screen.getByText("Answered 1 / 3")).toBeInTheDocument();
    });

    it("sends at once when every question is answered", async () => {
      const { requests } = renderQuiz();
      await pick(1, "かいがあって");
      await orderPieces();
      await pick(3, "かいがあって");

      await userEvent.click(submitButton());

      expect(screen.queryByRole("alertdialog")).toBeNull();
      await waitFor(() => expect(requests[0]?.body).toEqual({ answers: { q1: 2, q2: [1, 0, 2, 3], q3: 0 } }));
    });

    it("shows the error of a submit that failed", async () => {
      renderQuiz({ error: "Your answers couldn't be read. Please try again." });

      expect(await screen.findByRole("alert")).toHaveTextContent("Your answers couldn't be read.");
    });
  });
});
