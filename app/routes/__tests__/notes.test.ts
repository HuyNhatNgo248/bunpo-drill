import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { resetDatabase } from "#tests/helpers/db";
import { metaArgs, routeArgs } from "#tests/helpers/route";
import { ensureUser, signedInRequest } from "#tests/helpers/session";
import { addNote, listNotes } from "~/lib/notes.server";
import { createTest } from "~/lib/tests.server";
import { action, loader, meta } from "../notes";

/** The signed-in user, whose notes the route reads and writes. */
const USER_ID = 1;

const UNKNOWN_ID = "20261027-000000";

const NOTES_URL = "https://bunpo.test/notes";

/** Sends `body` as JSON with `method`, the way the pages' fetchers do. */
async function send(method: string, body: unknown) {
  const init = { method, headers: { "Content-Type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) };
  return action(routeArgs<Parameters<typeof action>[0]>(await signedInRequest(USER_ID, NOTES_URL, init)));
}

/** Saves a test and a note on 考えた末 from it, and gives the note's id. */
async function noted() {
  const { id } = await createTest(buildPayload());
  await addNote(USER_ID, { text: "考えた末", sentence: "考えた末、決めた。", testId: id, memo: "" });
  return (await listNotes(USER_ID))[0].id;
}

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

describe("notes loader", () => {
  it("gives the user's notes", async () => {
    await noted();

    const { notes } = await loader(routeArgs<Parameters<typeof loader>[0]>(await signedInRequest(USER_ID, NOTES_URL)));

    expect(notes).toMatchObject([{ text: "考えた末", testTitle: "第1週 1日目" }]);
  });
});

describe("notes action", () => {
  it("adds a note from a test, and says when the words are noted already", async () => {
    const { id } = await createTest(buildPayload());
    const body = { text: " 考えた末 ", sentence: "考えた末、決めた。", testId: id, anchor: "question-14", memo: "かんがえたすえ" };

    expect(await send("POST", body)).toEqual({ added: true });
    expect(await send("POST", body)).toEqual({ added: false });
    expect(await listNotes(USER_ID)).toMatchObject([{ text: "考えた末", anchor: "question-14", memo: "かんがえたすえ" }]);
  });

  it("sets a note's memo, and deletes a note", async () => {
    const noteId = await noted();

    expect(await send("PATCH", { id: noteId, memo: " しめる " })).toEqual({ saved: noteId });
    expect(await listNotes(USER_ID)).toMatchObject([{ memo: "しめる" }]);
    expect(await send("DELETE", { id: noteId })).toEqual({ deleted: noteId });
    expect(await listNotes(USER_ID)).toEqual([]);
  });

  describe("reading the body", () => {
    it("answers 400 for a note that is not one, or from a test that does not exist, and saves nothing", async () => {
      const { id } = await createTest(buildPayload());
      for (const body of [
        "not json",
        { text: "", sentence: "", testId: id },
        { text: "長".repeat(101), sentence: "", testId: id },
        { text: "末", sentence: "", testId: UNKNOWN_ID },
        { text: "末", sentence: "", testId: id, anchor: "javascript:alert(1)" },
      ]) {
        expect(await send("POST", body)).toMatchObject({ init: { status: 400 } });
      }
      expect(await listNotes(USER_ID)).toEqual([]);
    });

    it("answers 400 for a memo or a delete without a note id", async () => {
      expect(await send("PATCH", { memo: "しめる" })).toMatchObject({ init: { status: 400 } });
      expect(await send("DELETE", {})).toMatchObject({ init: { status: 400 } });
    });
  });
});

describe("notes meta", () => {
  it("names the page", () => {
    expect(meta(metaArgs<Parameters<typeof meta>[0]>({}))).toEqual([{ title: "Notes · 文法ドリル" }]);
  });
});
