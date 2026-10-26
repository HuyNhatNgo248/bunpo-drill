---
name: jlpt-reading-quiz-terminal
description: Run timed JLPT N2 reading practice in the terminal: write original passages in the 5 real N2 reading types (短文, 中文, 統合理解, 主張理解, 情報検索), ask the questions as multiple choice with AskUserQuestion, time each passage, explain every answer from the text, and log results to 記録.md. Use when the user wants N2 reading (読解) practice, a daily reading set, a specific reading type, or a full timed reading section.
argument-hint: "[type: 短文 | 中文 | 統合 | 長文 | 情報検索 | フル] [count, e.g. 3 passages]"
---

# JLPT N2 reading quiz (terminal)

Write N2 reading passages like the real test, time the user on each, and explain every
answer by pointing at the sentence that decides it.

## 1. Learn the format first

Read `reading-format.md` (next to this file). Every passage and question must look like
the official sample it records.

## 2. Read the request and the log

Arguments: $ARGUMENTS

The log is `~/Documents/JLPT 🇯🇵/N2/N2 読解 ノート/記録.md` (see step 6). Read it first
if it exists: it tells you which types were done recently, which topics were used, and
which question kinds the user misses.

| The user asks for | Set |
|---|---|
| nothing (the daily set) | 2 短文 + 1 中文 + 1 of 統合 / 長文 / 情報検索 (the one done least recently in the log) |
| a type (`中文`, `情報検索`…) | that type: 2 passages for 短文/中文, 1 for the others, unless a count is given |
| `フル` | the whole real section: 5 短文, 3 中文, 1 統合, 1 長文, 1 情報検索 (21 questions) |

Lean the questions toward the kinds the log shows as weak (理由, 指示語, 主張, 詳細, 比較,
条件).

## 3. Write the passages

Follow `reading-format.md`: lengths, styles, question kinds, (注) glosses and wrong-choice
traps. Also:

- Original texts only. No author attributions, no real people or companies.
- Topics the log hasn't used recently: work, technology, society, education, health,
  culture, environment, daily life. Vary practical texts (emails, notices) and essays.
- 情報検索: lay the flyer or table out with a markdown table, plus notes and footnotes.
- Write every passage and question set before showing anything. Keep the answers to
  yourself.
- **Run the checklist in `reading-format.md` on every passage** and rewrite until it
  passes. In particular: hedged claim in the second half, at least one answer two or more
  sentences from its cue, right answers paraphrased, wrong ones reusing the text's words.

**Calibration.** The user may log official practice results too (rows with 種類 `公式…`).
If the log has both, compare accuracy on the same types. When generated sets score 10+
points higher than official ones, make the next sets harder: answers further from their
cues, more paraphrase distance, closer wrong answers, length at the top of the range,
more N1-level glossed words. If they score clearly lower, ease off the same levers. Say
which way you adjusted and why.

Target times (rough, chosen so a full section fits the exam block):

| Type | Target per passage |
|---|---|
| 短文 | 2 min |
| 中文 | 6 min |
| 統合理解 | 6 min |
| 主張理解（長文） | 10 min |
| 情報検索 | 6 min |

## 4. Ask

For each passage, in this order:

1. Print the 大問 instruction (once per type), the passage number and target time.
2. Record the start time: `date +%s` with Bash.
3. Print the passage as normal text (blockquote, underlines as <u>…</u> or ①②, (注) under it).
4. Ask with AskUserQuestion, all of that passage's questions in one call (up to 4):
   - `header`: `短文1 問1` style.
   - `question`: the question, then the 4 choices on their own numbered lines (they're
     full sentences, too long for option labels).
   - `options`: `label` = `1`…`4`, `description` = `選択肢1`…, `multiSelect`: false.
   - "Other" with a number 1–4 counts as that choice; anything else is no answer.
5. Record the end time with `date +%s` and work out minutes and seconds.

## 5. Grade

After each passage:

- Time: `4分10秒（目標 6分）`, with ⚠ if over the target.
- For each question: `問1 ○` or `問1 ×  あなた: 2　正解: 4`.
- For each question, ○ or ×: quote the sentence in the text that decides the answer.
- For ×: in English, which trap the chosen answer used (changed detail, opposite, not in
  the text, true but not the answer, over-general, missed condition) and the question
  kind (理由, 指示語, 主張, 詳細, 比較, 条件).
- One line on reading strategy if it would have helped (read the question first for
  情報検索; the claim is usually in the last paragraph for 主張理解).

Then the running score and the next passage.

## 6. Log and finish

Append the session to `~/Documents/JLPT 🇯🇵/N2/N2 読解 ノート/記録.md`. Create it if missing:

```markdown
# N2 読解 記録

| 日付 | 種類 | トピック | 正解 | 時間（目標） | 間違えた問題の種類 |
|---|---|---|---|---|---|
| 2026-10-26 | 中文 | リモートワーク | 2/3 | 7分20秒（6分） | 指示語 |
```

One row per passage. If the user tells you a result from an official practice set, log it
too with 種類 `公式 中文`, `公式 フル`, etc., for calibration. Then report:

- Score per type and total, with the percentage.
- Time against targets: which types were slow.
- The question kinds missed most across the log, and what to practise next.
