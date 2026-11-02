import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { resetDatabase } from "#tests/helpers/db";
import { ensureUser } from "#tests/helpers/session";
import { addNote, deleteNote, listNotes, saveMemo } from "./notes.server";
import { createTest } from "./tests.server";

const USER_ID = 1;
const OTHER_ID = 2;

/** 考えた末 from a saved test, as the results page sends it. */
const note = (testId: string, text = "考えた末") => ({ text, sentence: "社長は何か月も考えた末、工場を閉めた。", testId, memo: "" });

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
  await ensureUser(OTHER_ID);
});

describe("notes", () => {
  it("lists the user's notes newest first, each with the title of its test", async () => {
    const { id } = await createTest(buildPayload());
    await addNote(USER_ID, note(id, "考えた末"));
    await addNote(USER_ID, { ...note(id, "閉める"), memo: "しめる" });
    await addNote(OTHER_ID, note(id, "工場"));

    expect(await listNotes(USER_ID)).toEqual([
      { id: expect.any(Number), text: "閉める", sentence: "社長は何か月も考えた末、工場を閉めた。", memo: "しめる", testId: id, anchor: null, testTitle: "第1週 1日目" },
      expect.objectContaining({ text: "考えた末", memo: "" }),
    ]);
  });

  it("keeps the first note when the same words are added again", async () => {
    const { id } = await createTest(buildPayload());

    expect(await addNote(USER_ID, note(id))).toBe(true);
    expect(await addNote(USER_ID, { ...note(id), memo: "after thinking" })).toBe(false);
    expect(await addNote(OTHER_ID, note(id))).toBe(true);

    expect((await listNotes(USER_ID)).map((row) => row.memo)).toEqual([""]);
  });

  it("sets a memo and deletes a note, only of the user's own", async () => {
    const { id } = await createTest(buildPayload());
    await addNote(USER_ID, note(id));
    const [{ id: noteId }] = await listNotes(USER_ID);

    await saveMemo(OTHER_ID, noteId, "not theirs");
    await deleteNote(OTHER_ID, noteId);
    expect(await listNotes(USER_ID)).toMatchObject([{ memo: "" }]);

    await saveMemo(USER_ID, noteId, "かんがえたすえ");
    expect(await listNotes(USER_ID)).toMatchObject([{ memo: "かんがえたすえ" }]);
    await deleteNote(USER_ID, noteId);
    expect(await listNotes(USER_ID)).toEqual([]);
  });
});
