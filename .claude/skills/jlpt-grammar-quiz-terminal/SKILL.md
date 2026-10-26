---
name: jlpt-grammar-quiz-terminal
description: Run a JLPT-style grammar quiz right here in the terminal: write questions from the user's N3/N2 文法ノート in the real exam format (文法形式の判断, 文の組み立て, 文章の文法), ask them as multiple choice with AskUserQuestion, grade each answer and explain the misses. Use when the user wants to practise, drill or be quizzed "here", "in the terminal", "in Claude", or answer questions interactively instead of in the 文法ドリル app. For a test sent to the app, use jlpt-grammar-quiz.
argument-hint: "[scope, e.g. 第5週 1〜3日目 | weak ones] [count, e.g. 10 questions | only 問題2]"
---

# JLPT grammar quiz (terminal)

Write a mock grammar section that looks like the real JLPT, ask it with the AskUserQuestion
picker, and grade as you go.

## 1. Learn the format first

Read `jlpt-format.md` (next to this file) before writing any question. It records the
official sample tests: counts, instructions, and how real questions and distractors are
built. Every question must look like one from that paper.

## 2. Read the request

Arguments: $ARGUMENTS

- **Level**: N3 or N2. Default N3.
- **Scope**: weeks, days or patterns. Read the notes and map patterns to ids exactly as
  `/Users/huyngo/Downloads/bunpo-drill/.claude/skills/jlpt-grammar-quiz/SKILL.md` step 2 says. "Weak ones" = the unreviewed chips from
  `bash /Users/huyngo/Downloads/bunpo-drill/.claude/skills/jlpt-grammar-quiz/tests.sh` from the repo root (needs the app running). If no scope is
  given, ask once. Don't guess.
- **Count**: default is double the real exam: N3 26 / 10 / 10 (問題1–3), N2 24 / 10 / 10
  (問題7–9). Use what the user asks for ("10 questions", "only 問題2", "no passage"). Split
  a total in the same ratio as the real exam.

Read the lesson block of every point you test: its connection rules, ⚠ traps and Nuance
table give you the distractors.

Some studied points have no lesson block: the user has studied **all of N2 (第1–8週)** in
the book, but the notes only have lessons for 第1–3週. For those, use the point's row in
`文型リスト.md` (pattern, meaning, the book's example, PDF pages). If you need the
connection rules to build distractors, read those pages of `N2 文法.pdf` with the Read
tool's `pages` parameter. Don't write lesson blocks for them; that's the japanese-grammar skill's job.

## 3. Write the whole set before asking anything

Number questions straight through like the real paper (N3 default: 1–26, 27–36, 37–46). Keep the
answer key to yourself until each question has been answered.

Follow `jlpt-format.md`, plus:

- Natural Japanese at the level, ordinary kanji, no furigana, no English.
- Write every sentence and passage new. Never reuse the notes' or the book's 例文, not even
  with a word or two swapped: new situation, new subject, new wording. The notes tell you
  what to test (rules, traps), not the text.
- Every grammar point in scope is tested at least once.
- Read each question with all 4 choices. If two work, or none does, rewrite it.
- 文の組み立て: check every plausible order; only one may be grammatical, and the ★ chunk
  must be fixed by grammar.
- 文章の文法: one passage per 5 blanks, written as the real one is (intro line, title,
  writer, です/ます, 3 paragraphs).

## 4. Ask

Before each 大問, print its instruction line exactly as in `jlpt-format.md`.

Ask with AskUserQuestion, up to 4 questions per call, in order:

- `header`: `問1`, `問14` … (the question number)
- `question`: the question text. Dialogue lines go on separate lines.
  - 文法形式の判断: the sentence with `（　　）`.
  - 文の組み立て: `before ＿＿ ＿＿ ★ ＿＿ after` (★ in the right slot).
  - 文章の文法: `[19] に入る最もよいものは？`. Print the full passage as normal text
    **before** the call so it stays on screen.
- `options`: the 4 choices in exam order, `label` = `1　ために` (number, full-width space,
  choice), `description` = `選択肢1`. For 文の組み立て the options are the 4 chunks.
- `multiSelect`: false.

If the user picks "Other" and types a number 1–4, take it as that choice. Anything else
counts as no answer; answer their question if they asked one, and carry on.

## 5. Grade after each call

For each question in the batch, one block:

- `問1 ○` or `問1 ×  あなた: 3　正解: 2 ように`
- For ×: in English, why the right answer fits and why their choice fails (the rule from
  the notes: connection, meaning, keigo direction, context). For 文の組み立て, also show the
  full solved sentence.
- For ○: one short line confirming the rule, nothing more.

Then the running score (`8 / 10`) and the next call.

## 6. Finish

- Score per 大問 and total, plus the percentage.
- The grammar points missed, with their ids (`n3-w5-d1-g2 〜ばかりか`), so they can be
  reviewed.
- Ask if they want another round on the missed points only.
