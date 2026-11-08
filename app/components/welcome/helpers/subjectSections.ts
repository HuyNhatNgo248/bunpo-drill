import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import type { TestKind } from "~/lib/views";
import type { DemoSection } from "../FormatDemo";

export type Section = { type: DemoSection; count: MessageDescriptor; how: MessageDescriptor };

/**
 * Each subject's 問題, in the exam's order. Grammar and kanji give the size of a test in the app; reading gives the N2
 * exam's own, which a reading set follows.
 */
export const SUBJECT_SECTIONS: Record<TestKind, { intro: MessageDescriptor; sections: Section[] }> = {
  grammar: {
    intro: msg`In the same order and format as the grammar part of the JLPT. A full test has 15 questions per part, 45 in all.`,
    sections: [
      { type: "fill-blank", count: msg`15 questions`, how: msg`Choose the most natural form for the （　） in a sentence, out of 4.` },
      { type: "sentence-order", count: msg`15 questions`, how: msg`Put 4 pieces in order, and choose the one that goes in ★.` },
      { type: "passage", count: msg`3 passages × 5 questions`, how: msg`Read a passage, and fill each blank with the words that fit its flow.` },
    ],
  },
  kanji: {
    intro: msg`The two kanji parts of the JLPT, in their format. A test has about 45 questions, from every chapter of the level.`,
    sections: [
      { type: "kanji-reading", count: msg`22 questions`, how: msg`Choose how the underlined word is read, out of 4 readings that differ by a sound or two.` },
      { type: "kanji-writing", count: msg`23 questions`, how: msg`Choose how the underlined word is written, out of 4 look-alike or sound-alike kanji.` },
    ],
  },
  reading: {
    intro: msg`The five reading parts of the N2 exam, in its order. The answers show the sentence that proves each one.`,
    sections: [
      { type: "reading-short", count: msg`5 texts × 1 question`, how: msg`Read a text of about 200 characters, and answer a question on it.` },
      { type: "reading-mid", count: msg`3 texts × 3 questions`, how: msg`Read a text of about 500 characters: its reasons, what a phrase points to, and its conclusion.` },
      { type: "reading-integrated", count: msg`2 texts × 2 questions`, how: msg`Read two texts on one topic, and compare what each one says.` },
      { type: "reading-claim", count: msg`1 text × 3 questions`, how: msg`Read a long essay, and find what the writer is arguing.` },
      { type: "reading-info", count: msg`1 flyer × 2 questions`, how: msg`Find what you need in a notice, flyer or table.` },
    ],
  },
};
