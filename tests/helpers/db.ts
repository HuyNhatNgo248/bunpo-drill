import { db } from "~/lib/db.server";
import { forgetSessionVersions } from "~/lib/users.server";

/**
 * Deletes every row, so each test starts with an empty database, and forgets the cached session versions.
 * The child tables go first, because foreign keys are on.
 *
 * @example
 * beforeEach(resetDatabase);
 */
export async function resetDatabase(): Promise<void> {
  await (await db()).batch(
    [
      "DELETE FROM reviewed",
      "DELETE FROM attempts",
      "DELETE FROM tests",
      "DELETE FROM kanji_chapters",
      "DELETE FROM learned_words",
      "DELETE FROM password_resets",
      "DELETE FROM users",
    ],
    "write",
  );
  forgetSessionVersions();
}
