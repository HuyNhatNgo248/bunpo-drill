// Copies tests from the old file storage (data/tests/<id>.json and data/order.json) into the
// database: Turso when .env sets TURSO_DATABASE_URL, otherwise the local data/bunpo.db.
// Usage: pnpm db:import   (running it again skips tests that are already there)
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { db } from "../app/lib/db.server.ts";
import { testPayloadSchema } from "../app/lib/payload.ts";

const root = path.resolve(process.env.DATA_DIR ?? "data");
const target = process.env.TURSO_DATABASE_URL ? "Turso" : "data/bunpo.db";

let names: string[] = [];
try {
  names = readdirSync(path.join(root, "tests")).filter((name) => name.endsWith(".json"));
} catch {
  // No old tests folder: nothing to import.
}
let order: string[] = [];
try {
  order = JSON.parse(readFileSync(path.join(root, "order.json"), "utf8"));
} catch {
  // Never dragged: new-first order.
}

const client = await db();
let imported = 0;
let existing = 0;
for (const name of names) {
  const test = JSON.parse(readFileSync(path.join(root, "tests", name), "utf8"));
  if (!testPayloadSchema.safeParse(test.payload).success) {
    console.warn(`Skipped ${name}: not a valid test.`);
    continue;
  }
  const position = order.indexOf(test.id);
  const { rowsAffected } = await client.execute({
    sql: "INSERT OR IGNORE INTO tests (id, created_at, position, payload, submission) VALUES (?, ?, ?, ?, ?)",
    args: [
      test.id,
      test.createdAt,
      position >= 0 ? position : null,
      JSON.stringify(test.payload),
      test.submission ? JSON.stringify(test.submission) : null,
    ],
  });
  if (!rowsAffected) {
    existing++;
    continue;
  }
  const chips = Object.keys(test.reviewed ?? {});
  if (chips.length) {
    await client.batch(
      chips.map((grammarId) => ({ sql: "INSERT INTO reviewed (test_id, grammar_id) VALUES (?, ?)", args: [test.id, grammarId] })),
      "write",
    );
  }
  imported++;
}

client.close();
console.log(`Imported ${imported} of ${names.length} tests into ${target}${existing ? ` (${existing} were already there)` : ""}.`);
