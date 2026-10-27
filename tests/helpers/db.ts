import { db } from "~/lib/db.server";

/**
 * Deletes every row, so each test starts with an empty database.
 * The child tables go first, because foreign keys are on.
 *
 * @example
 * beforeEach(resetDatabase);
 */
export async function resetDatabase(): Promise<void> {
  await (await db()).batch(["DELETE FROM reviewed", "DELETE FROM tests", "DELETE FROM password_resets", "DELETE FROM users"], "write");
}
