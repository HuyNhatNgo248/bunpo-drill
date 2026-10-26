---
name: jlpt-vocab-quiz-terminal
description: Run a JLPT N2 vocabulary quiz in the terminal (語形成, 文脈規定, 言い換え類義, 用法, the real exam format) from the user's 日本語総まとめ N2 語彙 book, asked as multiple choice with AskUserQuestion, graded with explanations, and every miss saved to 苦手.md for review. Use when the user wants to test or drill N2 vocabulary by week or day (第1週, 第2週 3日目), or review "my weak words" / 語彙の苦手. For kanji readings and spellings, use jlpt-kanji-quiz-terminal.
argument-hint: "[week/day, e.g. 第1週 | 第2週 3日目 | 苦手] [count, e.g. 10 questions]"
---

# JLPT N2 vocabulary quiz (terminal)

Quiz the words from 総まとめ N2 語彙 in the real exam's vocabulary format, and keep a list
of everything the user misses.

## 1. Learn the format first

Read `vocab-format.md` (next to this file). Every question must look like one from the
official sample it records.

## 2. Read the request

Arguments: $ARGUMENTS

- **Scope**: `第1週` (days 1–6), `第2週 3日目`, `第1〜2週`. If nothing is given, ask once.
- **苦手**: quiz only the open entries in the vocabulary `苦手.md` (see step 6).
- **Count**: a week is 22 questions, like the real section (語形成 5 / 文脈規定 7 /
  言い換え 5 / 用法 5). A single day is 8 (1 / 3 / 2 / 2). At most 50 per session. The
  user can set a count.
- **語形成** only works on prefix/suffix words (第7週 4–6日目 is all of them). When the
  scope has none, give those slots to 文脈規定.

## 3. Get the words

Notes live in `~/Documents/JLPT 🇯🇵/N2/N2 語彙 ノート/` as `第N週.md`, one per week.

**If the week's notes file exists and has the days you need, read it and skip to step 4.**

Otherwise build it from the book (`~/Documents/JLPT 🇯🇵/N2/N2 語彙.pdf`, a scan with no
text layer). **PDF page = book page + 1.** Render the lesson pages and Read each image:

```bash
swift ~/.claude/skills/jlpt-kanji-quiz-terminal/render.swift \
  "$HOME/Documents/JLPT 🇯🇵/N2/N2 語彙.pdf" <out-dir>/p <PDF pages, e.g. 13,14>
```

Write the images to the session scratchpad (or `$TMPDIR`).

| 週 | Theme | Book p. | 週 | Theme | Book p. |
|---|---|---|---|---|---|
| 1 | 楽しく暮らしていますか？ | 11 | 5 | やさしい漢字で書きますが… | 75 |
| 2 | 仕事は順調ですか？ | 27 | 6 | まとめて覚えましょう① (katakana, look-alikes) | 91 |
| 3 | いろいろ表現しましょう | 43 | 7 | まとめて覚えましょう② (multi-meaning, prefixes, suffixes) | 107 |
| 4 | 副詞をたっぷり覚えましょう | 59 | 8 | まとめて覚えましょう③ (compounds, set phrases) | 123 |

From a week's start page S: day d (1–6) is book pages S+2d−1 and S+2d; the 実戦問題 is
S+13 to S+15. Example: 第1週 1日目 = book p.12–13 = PDF 13–14.

Each day has a manga scene and おぼえましょう tables: the word (with furigana), its
meaning in English, Chinese and Korean, and marks: ➔ related word, ⇔ opposite,
❗ careful, ダメ wrong usage. Take the words, readings, English meaning, and any ⇔ / ❗ /
ダメ notes (those are the best traps). Skip the book's 実戦問題 pages; the user does those
in the book.

Save the notes in this shape, one section per day:

```markdown
# 第1週 楽しく暮らしていますか？（p.11–26）

## 1日目 アパートを探しています（p.12–13）

- 家賃（やちん）— monthly rent
- 無料（むりょう）／ただ — free ⇔ 有料（ゆうりょう）
- 広々（ひろびろ）としている — spacious
- 人通り（ひとどおり）が多い — lots of pedestrians
- 意見（いけん）を述べる（のべる）／まとめる／求める（もとめる） — express / summarize / ask for an opinion
```

Keep collocations whole, the way the book prints them (意見を述べる, not just 意見):
they are what 文脈規定 and 用法 test.

Check every reading against what you know; if the scan and your knowledge disagree, or
you can't read it, mark the word `⚠要確認` and never quiz it.

## 4. Write the questions

Read `vocab-format.md` again for the trap patterns, then write the set:

- **文脈規定**: a sentence with （　　）; 4 same-shape choices from the notes and
  neighbouring words; the collocation decides.
- **言い換え類義**: a sentence with the target in 【 】; 4 paraphrases that all fit the
  sentence, one with the same meaning.
- **用法**: the target word, then 4 natural sentences; 3 put it where a near-synonym
  belongs. Use the notes' ❗ and ダメ examples when there are any.
- **語形成**: a word with （　　） for the prefix or suffix; 4 single kanji from one family.
- Spread questions over the scope's days, test each word once per session, and make
  sure only one choice works. Spread answers over 1–4.

Write the whole set before asking. Keep the answers to yourself.

## 5. Ask and grade

Print the 大問 instruction from `vocab-format.md` before each block. Ask with
AskUserQuestion, up to 4 questions per call:

- `header`: `1週 問1` style, `options`: `label` = `1　分析`, `description` = `選択肢1`,
  `multiSelect`: false.
- **用法**: put the target word and the 4 numbered sentences in the `question` text (one
  per line); the options are just `1`–`4` with `description` = `選択肢1`…
- "Other" with a number 1–4 counts as that choice; anything else is no answer.

After each call, for each question:

- `問1 ○` or `問1 ×  あなた: 2　正解: 4 分析`
- For ×: the word, reading and meaning, and in English why it fits and why their choice
  doesn't (the collocation, the nuance, or for 用法 which near-synonym each wrong
  sentence wanted).
- For ○: one short line.

Then the running score and the next call.

## 6. Save the misses

`~/Documents/JLPT 🇯🇵/N2/N2 語彙 ノート/苦手.md` holds every miss. Create it if missing:

```markdown
# 苦手な語彙

## 未克服

| 日付 | 週・日 | 単語 | 読み | 意味 | 間違い | 問題 |
|---|---|---|---|---|---|---|
| 2026-10-26 | 1週1日 | 人通り | ひとどおり | pedestrian traffic | chose 人出 | 文脈規定 |

## 克服済み

| 日付 | 週・日 | 単語 | 読み | 意味 |
|---|---|---|---|---|
```

- After each graded call, add every miss to 未克服 (one row per word; if the word is
  already there, update the date and the 間違い column).
- In a `苦手` session, test each open word with a new question. A correct answer moves
  its row to 克服済み with today's date; a miss keeps it open.

## 7. Finish

- Score per 大問 and total, with the percentage.
- The words missed this session and how many open entries 苦手.md has.
- Suggest the next day or week, or a `苦手` round if there are 10+ open entries.
