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
  title: text("title").notNull().default(""),
});

/** A user's place in a test: their last submission and the draft of the next one. No row: not started. */
export const progress = sqliteTable(
  "progress",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    testId: text("test_id")
      .notNull()
      .references(() => tests.id),
    submission: text("submission"),
    draft: text("draft"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.testId] })],
);

export const reviewed = sqliteTable(
  "reviewed",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    testId: text("test_id")
      .notNull()
      .references(() => tests.id),
    grammarId: text("grammar_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.testId, t.grammarId] })],
);

export const attempts = sqliteTable(
  "attempts",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    testId: text("test_id")
      .notNull()
      .references(() => tests.id),
    submittedAt: text("submitted_at").notNull(),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.testId, t.submittedAt] })],
);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  // COLLATE NOCASE in the table itself, so every comparison of a name ignores case.
  name: text("name").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at").notNull(),
  email: text("email").unique(),
  sessionVersion: integer("session_version").notNull().default(0),
  lastTab: text("last_tab"),
});

export const kanjiChapters = sqliteTable(
  "kanji_chapters",
  {
    level: text("level").notNull(),
    chapter: integer("chapter").notNull(),
    payload: text("payload").notNull(),
    updatedAt: text("updated_at").notNull(),
    position: integer("position"),
  },
  (t) => [primaryKey({ columns: [t.level, t.chapter] })],
);

export const learnedWords = sqliteTable(
  "learned_words",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    wordId: text("word_id").notNull(),
    learnedAt: text("learned_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.wordId] })],
);

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  text: text("text").notNull(),
  sentence: text("sentence").notNull(),
  memo: text("memo").notNull().default(""),
  testId: text("test_id")
    .notNull()
    .references(() => tests.id),
  anchor: text("anchor"),
  createdAt: text("created_at").notNull(),
});

export const passwordResets = sqliteTable("password_resets", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});
