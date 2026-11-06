import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildReadingPassage, buildReadingPayload, buildReadingQuestion, buildReadingSetSection } from "#mocks/factories/reading";
import { readingGroupOf, readingTestPayloadSchema, underlineRuns } from "./reading-payload";
import { parseAnyPayload } from "./test-kinds";

/** The messages the schema reports, or a failure when it accepts the input. */
function messagesOf(input: unknown) {
  const result = readingTestPayloadSchema.safeParse(input);
  if (result.success) throw new Error("expected the schema to reject the input");
  return result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

const withQuestion = (overrides: Parameters<typeof buildReadingQuestion>[0]) =>
  buildReadingPayload({ sections: [buildReadingSetSection({ passages: [buildReadingPassage({ questions: [buildReadingQuestion(overrides)] })] })] });

describe("readingTestPayloadSchema", () => {
  it("accepts a set, and the API tells it from a grammar or kanji test by its kind", () => {
    const payload = buildReadingPayload();

    expect(readingTestPayloadSchema.parse(payload)).toEqual(payload);
    expect(parseAnyPayload(payload)).toEqual({ ok: true, payload });
  });

  it("asks for the evidence copied once from the passage, without its <u> tags", () => {
    expect(messagesOf(withQuestion({ evidence: "迷うことは楽しい。" }))).toEqual([
      "sections.0.passages.0.questions.0.evidence: The evidence must be copied exactly from the passage, without <u> tags.",
    ]);
    expect(messagesOf(withQuestion({ evidence: "迷う" }))).toEqual([
      "sections.0.passages.0.questions.0.evidence: The evidence appears more than once: copy a longer part.",
    ]);
    expect(readingTestPayloadSchema.safeParse(withQuestion({ evidence: "私はあえてアプリを閉じて歩く。" })).success).toBe(true);
  });

  it("takes a trap for every wrong choice and none for the right one", () => {
    expect(messagesOf(withQuestion({ traps: ["opposite", null, "opposite", "over-general"] }))).toEqual([
      "sections.0.passages.0.questions.0.traps.1: Name the trap of every wrong choice.",
      "sections.0.passages.0.questions.0.traps.2: The right choice has no trap: null.",
    ]);
  });

  it("rejects an underline that isn't closed, and a （注） word the passage doesn't have", () => {
    const passage = buildReadingPassage({ blocks: [{ kind: "text", text: "<u>思いがけない店に出会う経験は、迷う余地があってこそ生まれる。" }], notes: [{ word: "醍醐味", gloss: "本当のおもしろさ" }] });

    expect(messagesOf(buildReadingPayload({ sections: [buildReadingSetSection({ passages: [passage] })] }))).toEqual([
      "sections.0.passages.0.blocks.0.text: Every <u> must be closed, not nested and not empty.",
      'sections.0.passages.0.notes.0.word: "醍醐味" is not in the passage.',
    ]);
  });

  it("keeps the exam's order, one section per type, and question ids running through them", () => {
    const short = buildReadingSetSection();
    const mid = buildReadingSetSection({ type: "reading-mid", passages: [buildReadingPassage({ questions: [buildReadingQuestion({ id: "q2" })] })] });

    expect(readingTestPayloadSchema.safeParse(buildReadingPayload({ sections: [short, mid] })).success).toBe(true);
    expect(messagesOf(buildReadingPayload({ sections: [mid, short] }))).toContain(
      "sections: One section per type, in the exam's order: 短文, 中文, 長文, 統合理解, 主張理解, 情報検索.",
    );
  });

  it("asks 統合理解 for texts A and B, and 情報検索 for a table", () => {
    const integrated = buildReadingSetSection({ type: "reading-integrated" });
    const info = buildReadingSetSection({ type: "reading-info", passages: [buildReadingPassage({ questions: [buildReadingQuestion({ id: "q2" })] })] });

    expect(messagesOf(buildReadingPayload({ sections: [integrated, info] }))).toEqual([
      "sections.0.passages.0.blocks: 統合理解 has two text blocks, labelled A and B.",
      "sections.1.passages.0.blocks: 情報検索 needs a table.",
    ]);
  });

  it("takes only the reading 問題 the level's exam has", () => {
    const long = buildReadingSetSection({ type: "reading-long" });

    expect(readingTestPayloadSchema.safeParse(buildReadingPayload({ level: "N3", sections: [long] })).success).toBe(true);
    expect(readingTestPayloadSchema.safeParse(buildReadingPayload({ level: "N5" })).success).toBe(true);
    expect(messagesOf(buildReadingPayload({ level: "N2", sections: [long] }))).toEqual(["sections.0.type: N2's exam has no reading-long."]);
    expect(messagesOf(buildReadingPayload({ level: "N4", sections: [buildReadingSetSection({ type: "reading-claim" })] }))).toEqual([
      "sections.0.type: N4's exam has no reading-claim.",
    ]);
  });

  it("finds evidence in a table cell, and checks each row has a cell per heading", () => {
    const table = { kind: "table" as const, head: ["プラン", "料金"], rows: [["A", "3,000円"], ["B"]] };
    const passage = buildReadingPassage({ blocks: [table], notes: [], questions: [buildReadingQuestion({ prompt: "安いのはどれか。", evidence: "3,000円" })] });

    expect(messagesOf(buildReadingPayload({ sections: [buildReadingSetSection({ type: "reading-info", passages: [passage] })] }))).toEqual([
      "sections.0.passages.0.blocks.0.rows: Every row needs one cell per heading.",
    ]);
  });
});

describe("underlineRuns", () => {
  it("splits a text at its underlines", () => {
    expect(underlineRuns("しかし、<u>私は歩く</u>。")).toEqual([
      { text: "しかし、", underline: false },
      { text: "私は歩く", underline: true },
      { text: "。", underline: false },
    ]);
  });
});

describe("readingGroupOf", () => {
  it("lists a set of one type under that type, and a set of several under 総合", () => {
    const mid = buildReadingSetSection({ type: "reading-mid" });

    expect(readingGroupOf({ sections: [buildReadingSetSection()] })).toBe(1);
    expect(readingGroupOf({ sections: [mid] })).toBe(2);
    expect(readingGroupOf({ sections: [buildReadingSetSection(), mid] })).toBe(7);
  });
});

describe("the reading skill's schema file", () => {
  // After a change to the schema, `pnpm schema` rewrites the file.
  it("matches the reading test schema, so Claude and the app agree on the format", async () => {
    const schema = {
      ...z.toJSONSchema(readingTestPayloadSchema, { target: "draft-2020-12", unrepresentable: "any" }),
      $id: "https://bunpo-drill.local/schema/reading-test.v1.json",
    };

    await expect(`${JSON.stringify(schema, null, 2)}\n`).toMatchFileSnapshot("../../.claude/skills/jlpt-reading-quiz/test.schema.json");
  });
});
