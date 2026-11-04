import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { ensureUser, signedInRequest } from "#tests/helpers/session";
import { addNote } from "~/lib/notes.server";
import { createTest } from "~/lib/tests.server";
import { loader } from "../note-cards";

const USER_ID = 1;

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

describe("note cards loader", () => {
  it("gives only the notes with a memo", async () => {
    const { id } = await createTest(buildPayload());
    await addNote(USER_ID, { text: "考えた末", sentence: "考えた末、決めた。", testId: id, memo: "after thinking" });
    await addNote(USER_ID, { text: "工場", sentence: "工場で働く。", testId: id, memo: "" });

    const { notes } = await loader(routeArgs<Parameters<typeof loader>[0]>(await signedInRequest(USER_ID, "https://bunpo.test/notes/cards")));

    expect(notes).toMatchObject([{ text: "考えた末" }]);
  });
});
