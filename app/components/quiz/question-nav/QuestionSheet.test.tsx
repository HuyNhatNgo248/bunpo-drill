import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import { QuestionSheet } from "./QuestionSheet";

const SECTIONS = buildQuizView().sections;

const openButton = () => screen.getByRole("button", { name: /問題一覧/ });

describe("QuestionSheet", () => {
  it("says on its button how many questions are left", () => {
    render(<QuestionSheet sections={SECTIONS} answered={new Set(["q1"])} remaining={2} />);

    expect(openButton()).toHaveTextContent("未回答 2問");
  });

  it("says that every question is answered when none is left", () => {
    render(<QuestionSheet sections={SECTIONS} answered={new Set(["q1", "q2", "q3"])} remaining={0} />);

    expect(openButton()).toHaveTextContent("すべて回答済み");
  });

  it("opens the question list with the answered count", async () => {
    render(<QuestionSheet sections={SECTIONS} answered={new Set(["q1"])} remaining={2} />);

    await userEvent.click(openButton());

    const sheet = screen.getByRole("dialog", { name: "問題一覧" });
    expect(sheet).toHaveTextContent("回答済み 1 / 3");
    expect(screen.getByRole("button", { name: "問題1（回答済み）" })).toBeInTheDocument();
  });

  it("closes when a number is picked", async () => {
    render(<QuestionSheet sections={SECTIONS} answered={new Set()} remaining={3} />);
    await userEvent.click(openButton());

    await userEvent.click(screen.getByRole("button", { name: "問題2（未回答）" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
