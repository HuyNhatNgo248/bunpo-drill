// Writes the skill's schema.json from the Zod payload schema, so the two never drift.
// Usage: pnpm schema           (write)
//        pnpm schema --check   (fail if schema.json is out of date)
import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { testPayloadSchema } from "../app/lib/payload.ts";

const target = new URL("../.claude/skills/jlpt-grammar-quiz/schema.json", import.meta.url);

const schema = {
  ...z.toJSONSchema(testPayloadSchema, { target: "draft-2020-12", unrepresentable: "any" }),
  $id: "https://bunpo-drill.local/schema/test-payload.v1.json",
};
const json = `${JSON.stringify(schema, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = readFileSync(target, "utf8");
  if (current !== json) {
    console.error("schema.json is out of date. Run: pnpm schema");
    process.exit(1);
  }
  console.log("schema.json is up to date.");
} else {
  writeFileSync(target, json);
  console.log(`Wrote ${target.pathname}`);
}
