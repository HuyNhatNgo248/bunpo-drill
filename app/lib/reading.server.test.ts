import { beforeEach, describe, expect, it } from "vitest";
import { buildKanjiTestPayload } from "#mocks/factories/kanji";
import { buildReadingPassage, buildReadingPayload, buildReadingQuestion, buildReadingSetSection } from "#mocks/factories/reading";
import { resetDatabase } from "#tests/helpers/db";
import { ensureUser } from "#tests/helpers/session";
import { toSubmission } from "./grading.server";
import { listReadingSets, toReadingHome, type ReadingSetRow } from "./reading.server";
import { createTest, saveDraft, saveSubmission } from "./tests.server";

const USER_ID = 1;

/** 中文 with two questions, q1 a 指示語 and q2 a 理由. */
const MID = buildReadingPayload({
  title: "中文 1",
  sections: [
    buildReadingSetSection({
      type: "reading-mid",
      passages: [buildReadingPassage({ questions: [buildReadingQuestion({ kind: "指示語" }), buildReadingQuestion({ id: "q2" })] })],
    }),
  ],
});

/** A set as listReadingSets reads it: not started, or with a submission of `answers` timed at `times`. */
function row(id: string, payload = buildReadingPayload(), answers?: Record<string, number>, times?: number[]): ReadingSetRow {
  return { id, payload, submission: answers ? toSubmission(payload, answers, times) : null, draft: null };
}

describe("toReadingHome", () => {
  it("lists the level's types, a set under its type and one of several types under 総合, titles in number order", () => {
    const mixed = buildReadingPayload({ title: "総合 1", sections: [buildReadingSetSection(), MID.sections[0]!] });
    // q3 for the 中文 part, after 短文's q1.
    mixed.sections[1] = { ...MID.sections[0]!, passages: [{ ...MID.sections[0]!.passages[0]!, questions: [buildReadingQuestion({ id: "q2" }), buildReadingQuestion({ id: "q3" })] }] };
    const home = toReadingHome("N2", [row("a", buildReadingPayload({ title: "短文 10" })), row("b"), row("c", mixed)]);

    expect(home.groups.map((group) => [group.value, group.type, group.sets.map((set) => set.title)])).toEqual([
      [1, "reading-short", ["短文 1", "短文 10"]],
      [2, "reading-mid", []],
      [4, "reading-integrated", []],
      [5, "reading-claim", []],
      [6, "reading-info", []],
      [7, "mixed", ["総合 1"]],
    ]);
    expect(home.groups[5]).toMatchObject({ sets: [{ questionCount: 3, targetSeconds: 120 + 360 }] });
    expect(toReadingHome("N5", []).groups.map((group) => group.type)).toEqual(["reading-short", "reading-mid", "reading-info", "mixed"]);
  });

  it("sums up the taken sets: their score and time, the kinds they missed most, and the pace a passage", () => {
    const home = toReadingHome("N2", [row("a", MID, { q1: 0, q2: 0 }, [400]), row("b", { ...MID, title: "中文 2" }, { q1: 0, q2: 2 }, [300])]);
    const mid = home.groups[1]!;

    expect(mid.sets[0]).toMatchObject({ result: { score: 0, total: 2 }, seconds: 400, targetSeconds: 360, answered: null });
    expect(mid.missed).toEqual([
      { kind: "指示語", count: 2 },
      { kind: "理由", count: 1 },
    ]);
    expect(mid.pace).toEqual({ seconds: 350, target: 360 });
    expect(home.groups[0]!.pace).toBeNull();
  });
});

describe("listReadingSets", () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureUser(USER_ID);
  });

  it("reads a level's reading sets with the user's draft or result, and no other kind of test", async () => {
    const started = await createTest(buildReadingPayload());
    const taken = await createTest(MID);
    await createTest(buildKanjiTestPayload());
    await createTest(buildReadingPayload({ level: "N3" }));
    await saveDraft(USER_ID, started.id, { answers: {}, checked: [], times: [30] });
    await saveSubmission(USER_ID, taken.id, toSubmission(MID, { q1: 2 }, [200]));

    const sets = await listReadingSets("N2", USER_ID);

    expect(sets.map((set) => set.payload.title)).toEqual(["短文 1", "中文 1"]);
    expect(sets[0]).toMatchObject({ submission: null, draft: { times: [30] } });
    expect(sets[1]!.submission).toMatchObject({ score: 1, total: 2, times: [200] });
  });
});
