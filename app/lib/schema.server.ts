import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The tables, for Drizzle's typed queries (orm() in db.server.ts). Payloads and submissions stay JSON text: the
 * code that reads them checks each row, so an older or broken one is skipped instead of failing the query.
 * shortcut: db.server.ts still creates and upgrades the tables with its own SQL, so the two must be kept in step;
 * move that to drizzle-kit migrations if the schema starts changing often.
 */

export const tests = sqliteTable("tests", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  position: integer("position"),
  payload: text("payload").notNull(),
  submission: text("submission"),
});

export const reviewed = sqliteTable(
  "reviewed",
  {
    testId: text("test_id")
      .notNull()
      .references(() => tests.id),
    grammarId: text("grammar_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.testId, t.grammarId] })],
);

export const attempts = sqliteTable(
  "attempts",
  {
    testId: text("test_id")
      .notNull()
      .references(() => tests.id),
    submittedAt: text("submitted_at").notNull(),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
  },
  (t) => [primaryKey({ columns: [t.testId, t.submittedAt] })],
);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  // COLLATE NOCASE in the table itself, so every comparison of a name ignores case.
  name: text("name").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at").notNull(),
  email: text("email").unique(),
  sessionVersion: integer("session_version").notNull().default(0),
});

export const kanjiChapters = sqliteTable(
  "kanji_chapters",
  {
    level: text("level").notNull(),
    chapter: integer("chapter").notNull(),
    payload: text("payload").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.level, t.chapter] })],
);

export const learnedWords = sqliteTable("learned_words", {
  wordId: text("word_id").primaryKey(),
  learnedAt: text("learned_at").notNull(),
});

export const passwordResets = sqliteTable("password_resets", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});
