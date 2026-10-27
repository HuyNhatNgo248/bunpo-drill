import { beforeEach, describe, expect, it } from "vitest";
import {
  buildFillBlankSection,
  buildGrammarPoint,
  buildPassageSection,
  buildPayload,
  buildSentenceOrderQuestion,
  buildSentenceOrderSection,
  GRAMMAR_ID,
} from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { createTest, saveSubmission, setReviewed } from "~/lib/tests.server";
import { loader, meta } from "../home";

/** Saves a test and a submission of it with `score` out of 3, and the grammar of the wrong answers. */
async function takeTest(score: number, wrongGrammarIds: string[] = []) {
  const { id } = await createTest(buildPayload());
  await saveSubmission(id, buildSubmission({ score, total: 3, wrongGrammarIds }));
  return id;
}

beforeEach(resetDatabase);

describe("home loader", () => {
  it("lists the tests, and works out the figures over the taken ones", async () => {
    await takeTest(3);
    await takeTest(1, [GRAMMAR_ID]);
    await createTest(buildPayload());

    const { tests, stats } = await loader();

    expect(tests).toHaveLength(3);
    // 100% and 33% give 66.5%, which rounds to 67%.
    expect(stats).toEqual({ average: 67, toReview: 1, taken: 2 });
  });

  it("gives no average before any test is taken", async () => {
    await createTest(buildPayload());

    expect((await loader()).stats).toEqual({ average: null, toReview: 0, taken: 0 });
  });

  it("counts a grammar pattern to review once, however many tests got it wrong", async () => {
    await takeTest(1, [GRAMMAR_ID]);
    await takeTest(2, [GRAMMAR_ID]);

    expect((await loader()).stats.toReview).toBe(1);
  });

  it("does not count a pattern that is marked reviewed", async () => {
    const id = await takeTest(1, [GRAMMAR_ID]);
    await setReviewed(id, GRAMMAR_ID, true);

    expect((await loader()).stats.toReview).toBe(0);
  });

  it("counts the patterns, not the grammar ids, so the same pattern in two weeks counts once", async () => {
    // Both points have the pattern 〜かいがある. q2 tests the second one, so the payload stays valid.
    const points = [buildGrammarPoint(), buildGrammarPoint({ id: "n2-w2-d1-g1", week: 2 })];
    const order = buildSentenceOrderSection({ questions: [buildSentenceOrderQuestion({ grammarId: "n2-w2-d1-g1" })] });
    const { id } = await createTest(
      buildPayload({ grammarPoints: points, sections: [buildFillBlankSection(), order, buildPassageSection()] }),
    );
    await saveSubmission(id, buildSubmission({ score: 0, wrongGrammarIds: [GRAMMAR_ID, "n2-w2-d1-g1"] }));

    expect((await loader()).stats.toReview).toBe(1);
  });
});

describe("home meta", () => {
  it("names the page", () => {
    expect(meta()).toEqual([{ title: "模擬試験 · 文法ドリル" }]);
  });
});
