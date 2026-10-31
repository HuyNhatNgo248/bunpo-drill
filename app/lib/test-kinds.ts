import { kanjiTestPayloadSchema, type KanjiTestPayload } from "./kanji-payload";
import { issuesOf, testPayloadSchema, type PayloadIssue, type TestPayload } from "./payload";

/**
 * A saved test is a grammar test (payload.ts) or a kanji test (kanji-payload.ts). Only a kanji payload has a `kind`,
 * so the grammar format, and the tests saved in it, stay as they were.
 */
export type AnyPayload = TestPayload | KanjiTestPayload;

/** True for a kanji test. */
export const isKanji = (payload: AnyPayload): payload is KanjiTestPayload => "kind" in payload;

/** The schema a body claims to follow: the kanji one when it says `"kind": "kanji"`, the grammar one otherwise. */
function schemaOf(input: unknown) {
  return typeof input === "object" && input !== null && "kind" in input && input.kind === "kanji" ? kanjiTestPayloadSchema : testPayloadSchema;
}

/** Checks a POSTed test of either kind, the way parsePayload checks a grammar one. */
export function parseAnyPayload(input: unknown): { ok: true; payload: AnyPayload } | { ok: false; issues: PayloadIssue[] } {
  const result = schemaOf(input).safeParse(input);
  return result.success ? { ok: true, payload: result.data } : { ok: false, issues: issuesOf(result.error) };
}

/** A saved payload, or null when it is in no current format (an older one, or edited by hand). */
export function readPayload(input: unknown): AnyPayload | null {
  const result = schemaOf(input).safeParse(input);
  return result.success ? result.data : null;
}
