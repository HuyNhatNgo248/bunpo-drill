import { kanjiTestPayloadSchema, type KanjiTestPayload } from "./kanji-payload";
import { issuesOf, testPayloadSchema, type PayloadIssue, type TestPayload } from "./payload";
import { readingTestPayloadSchema, type ReadingTestPayload } from "./reading-payload";

/**
 * A saved test is a grammar test (payload.ts), a kanji test (kanji-payload.ts) or a reading set (reading-payload.ts).
 * Only kanji and reading payloads have a `kind`, so the grammar format, and the tests saved in it, stay as they were.
 */
export type AnyPayload = TestPayload | KanjiTestPayload | ReadingTestPayload;

/** True for a kanji test. */
export const isKanji = (payload: AnyPayload): payload is KanjiTestPayload => "kind" in payload && payload.kind === "kanji";

/** True for a reading set. */
export const isReading = (payload: AnyPayload): payload is ReadingTestPayload => "kind" in payload && payload.kind === "reading";

/** The schema a body claims to follow, by its `kind`: kanji, reading, or none for grammar. */
function schemaOf(input: unknown) {
  const kind = typeof input === "object" && input !== null && "kind" in input ? input.kind : undefined;
  return kind === "kanji" ? kanjiTestPayloadSchema : kind === "reading" ? readingTestPayloadSchema : testPayloadSchema;
}

/** Checks a POSTed test of any kind, the way parsePayload checks a grammar one. */
export function parseAnyPayload(input: unknown): { ok: true; payload: AnyPayload } | { ok: false; issues: PayloadIssue[] } {
  const result = schemaOf(input).safeParse(input);
  return result.success ? { ok: true, payload: result.data } : { ok: false, issues: issuesOf(result.error) };
}

/** A saved payload, or null when it is in no current format (an older one, or edited by hand). */
export function readPayload(input: unknown): AnyPayload | null {
  const result = schemaOf(input).safeParse(input);
  return result.success ? result.data : null;
}
