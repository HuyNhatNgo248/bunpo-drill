import { beforeEach, describe, expect, it } from "vitest";
import {
  buildFillBlankQuestion,
  buildFillBlankSection,
  buildGrammarPoint,
  buildPassage,
  buildPassageQuestion,
  buildPassageSection,
  buildPayload,
  buildSentenceOrderQuestion,
  buildSentenceOrderSection,
  GRAMMAR_ID,
} from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { createTest, saveOrder, saveSubmission, setReviewed } from "~/lib/tests.server";
import { loader, meta } from "../home";

/** Saves a test and a submission of it with `score` out of 3, and the grammar of the wrong answers. */
async function takeTest(score: number, wrongGrammarIds: string[] = []) {
  const { id } = await createTest(buildPayload());
  await saveSubmission(id, buildSubmission({ score, total: 3, wrongGrammarIds }));
  return id;
}

/** The factory's payload with its one grammar point moved to N3, so it stays valid. */
function buildN3Payload() {
  const grammarId = "n3-w1-d1-g1";
  return buildPayload({
    level: "N3",
    grammarPoints: [buildGrammarPoint({ id: grammarId })],
    sections: [
      buildFillBlankSection({ questions: [buildFillBlankQuestion({ grammarId })] }),
      buildSentenceOrderSection({ questions: [buildSentenceOrderQuestion({ grammarId })] }),
      buildPassageSection({ passages: [buildPassage({ questions: [buildPassageQuestion({ grammarId })] })] }),
    ],
  });
}

/** The home loader for the page at `search`, e.g. "?level=N3". */
const load = (search = "") => loader(routeArgs<Parameters<typeof loader>[0]>(new Request(`https://bunpo.test/${search}`)));

beforeEach(resetDatabase);

describe("home loader", () => {
  it("lists the tests, and works out the figures over the taken ones", async () => {
    await takeTest(3);
    await takeTest(1, [GRAMMAR_ID]);
    await createTest(buildPayload());

    const { tests, stats } = await load();

    expect(tests).toHaveLength(3);
    // 100% and 33% give 66.5%, which rounds to 67%.
    expect(stats).toEqual({ average: 67, toReview: 1, taken: 2 });
  });

  it("gives no average before any test is taken", async () => {
    await createTest(buildPayload());

    expect((await load()).stats).toEqual({ average: null, toReview: 0, taken: 0 });
  });

  it("counts a grammar pattern to review once, however many tests got it wrong", async () => {
    await takeTest(1, [GRAMMAR_ID]);
    await takeTest(2, [GRAMMAR_ID]);

    expect((await load()).stats.toReview).toBe(1);
  });

  it("does not count a pattern that is marked reviewed", async () => {
    const id = await takeTest(1, [GRAMMAR_ID]);
    await setReviewed(id, GRAMMAR_ID, true);

    expect((await load()).stats.toReview).toBe(0);
  });

  it("counts the patterns, not the grammar ids, so the same pattern in two weeks counts once", async () => {
    // Both points have the pattern 〜かいがある. q2 tests the second one, so the payload stays valid.
    const points = [buildGrammarPoint(), buildGrammarPoint({ id: "n2-w2-d1-g1", week: 2 })];
    const order = buildSentenceOrderSection({ questions: [buildSentenceOrderQuestion({ grammarId: "n2-w2-d1-g1" })] });
    const { id } = await createTest(
      buildPayload({ grammarPoints: points, sections: [buildFillBlankSection(), order, buildPassageSection()] }),
    );
    await saveSubmission(id, buildSubmission({ score: 0, wrongGrammarIds: [GRAMMAR_ID, "n2-w2-d1-g1"] }));

    expect((await load()).stats.toReview).toBe(1);
  });
});

describe("home loader levels", () => {
  it("shows the level in ?level=, with the figures over its tests only", async () => {
    await takeTest(3);
    await createTest(buildN3Payload());

    const { tests, stats, level, levels } = await load("?level=N3");

    expect(tests.map((test) => test.level)).toEqual(["N3"]);
    expect(stats).toEqual({ average: null, toReview: 0, taken: 0 });
    expect({ level, levels }).toEqual({ level: "N3", levels: ["N3", "N2"] });
  });

  it("shows the level of the top test when the URL names none", async () => {
    const n3 = await createTest(buildN3Payload());
    const n2 = await createTest(buildPayload());
    await saveOrder([n3.id, n2.id]);

    expect((await load()).level).toBe("N3");
  });

  it("shows the level of the top test when the level in the URL has no tests", async () => {
    await createTest(buildPayload());

    const { tests, level, levels } = await load("?level=N3");

    expect({ count: tests.length, level, levels }).toEqual({ count: 1, level: "N2", levels: ["N2"] });
  });

  it("has no level before any test is saved", async () => {
    expect(await load()).toMatchObject({ tests: [], level: null, levels: [] });
  });
});

describe("home meta", () => {
  it("names the page", () => {
    expect(meta()).toEqual([{ title: "模擬試験 · 文法ドリル" }]);
  });
});
