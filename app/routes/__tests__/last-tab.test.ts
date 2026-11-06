import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { ensureUser, signedInRequest } from "#tests/helpers/session";
import { lastTabOf } from "~/lib/users.server";
import { action } from "../helpers/last-tab";

const USER_ID = 1;

/** Posts `body` to /last-tab as the signed-in user. */
const post = async (body: string) =>
  action(routeArgs<Parameters<typeof action>[0]>(await signedInRequest(USER_ID, "https://bunpo.test/last-tab", { method: "POST", body })));

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

describe("last-tab action", () => {
  it("saves the tab the page sends as the user's last tab", async () => {
    expect((await post("kanji:N3")).status).toBe(204);

    expect(await lastTabOf(USER_ID)).toEqual({ subject: "kanji", level: "N3" });
  });

  it("refuses a body that is no tab, saving nothing", async () => {
    expect((await post("kanji:N9")).status).toBe(400);

    expect(await lastTabOf(USER_ID)).toBeNull();
  });
});
