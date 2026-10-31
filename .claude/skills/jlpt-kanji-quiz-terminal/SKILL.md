---
name: jlpt-kanji-quiz-terminal
description: Run a JLPT N2 kanji quiz in the terminal (漢字読み and 表記, the real exam format) from the user's 漢字マスターN2 book, asked as multiple choice with AskUserQuestion, graded with explanations, and every miss saved to 苦手.md for review. Use when the user wants to test or drill N2 kanji by chapter (1章, 3〜5章), run a kanji gap test, or review "my weak kanji" / 苦手.
argument-hint: "[chapters, e.g. 1章 | 1〜5章 | 苦手] [count, e.g. 20 questions]"
---

# JLPT N2 kanji quiz (terminal)

Quiz the words from 漢字マスターN2 in the real exam's kanji format, and keep a list of
everything the user misses.

## 1. Learn the format first

Read `kanji-format.md` (next to this file). Every question must look like one from the
official sample it records.

## 2. Read the request

Arguments: $ARGUMENTS

- **Chapters**: `1章`, `1〜5章`, `基本編` (1–10), `挑戦編` (11–19). Skip 19章 (地名) unless
  asked: place names almost never appear on N2.
- **苦手**: quiz only the open entries in `苦手.md` (see step 6).
- If nothing is given, ask once which chapters.
- **Count**: default 10 per chapter (5 漢字読み + 5 表記), at most 50 per session. If the
  scope is bigger, say so and quiz the first chapters that fit. The user can set a count.

## 3. Get the chapter's words

Notes live in `~/Documents/JLPT 🇯🇵/N2/N2 漢字 ノート/` as `第N章.md`, one per chapter.

**If the chapter's notes file exists, read it and skip to step 4.**

Otherwise build it from the book (`~/Documents/JLPT 🇯🇵/N2/N2 漢字マスター.pdf`, a scan
with no text layer; PDF page = book page). Read the chapter's lesson pages with the Read
tool's `pages` parameter (e.g. `pages: "20-24"`; needs poppler, `brew install poppler`).

| 章 | Theme | Lesson pages | 章 | Theme | Lesson pages |
|---|---|---|---|---|---|
| 1 | 生活-1 | 20–24 | 11 | 生活-2 | 104–108 |
| 2 | 町 | 26–30 | 12 | 働く | 110–114 |
| 3 | 文化 | 36–40 | 13 | 健康-2 | 120–124 |
| 4 | 健康-1 | 42–46 | 14 | 動植物 | 126–130 |
| 5 | 仕事 | 52–56 | 15 | 地球 | 136–140 |
| 6 | 会社 | 58–62 | 16 | 文化 | 142–144 |
| 7 | ミステリー | 68–72 | 17 | 社会-2 | 150–154 |
| 8 | 人間関係 | 74–78 | 18 | 社会-3 | 156–160 |
| 9 | 災害 | 84–88 | 19 | 地名 | 162–164 |
| 10 | 社会-1 | 90–94 | | | |

Each page has 6 kanji. Each entry has the kanji, stroke count, kun readings (hiragana),
on readings (katakana) and example words with furigana; △ marks less common words.

Save the notes in this shape, one section per lesson page, then one section for every
other kanji that appears in the words. The app's flashcards (`jlpt-kanji-quiz`) read the
same notes, so every word has a short English meaning after `｜`, and every kanji of every
word has its readings, as a headword or under 他の漢字:

```markdown
# 第1章 生活-1（p.20–24）

## ギフト（p.20）

- **贈**（18）おく-る／ゾウ・ソウ — 贈る（おくる｜to give as a gift）、贈り物（おくりもの｜a present）、贈答品（ぞうとうひん｜gifts, given and received）、△寄贈（きぞう／きそう｜donation）
- **渡**（12）わた-る・わた-す／ト — 渡る（わたる｜to cross）、渡す（わたす｜to hand over）、渡り鳥（わたりどり｜migratory bird）、渡航（とこう｜travel abroad）

## 他の漢字

- **答** こた-える・こた-え／トウ
- **品** しな／ヒン
- **鳥** とり／チョウ
```

A notes file from before this format (no stroke counts, meanings or 他の漢字) still works
here; add the missing parts the next time you read the chapter's pages.

The furigana is small. Check every reading against what you know; if the scan and your
knowledge disagree, or you can't read it, mark the word `⚠要確認` and never quiz it.

## 4. Write the questions

Read `kanji-format.md` again for the trap patterns, then for each chapter:

- **漢字読み**: a natural sentence with one word from the notes in 【 】. 4 readings in
  hiragana: the right one plus traps built as the format file describes (2×2 grids of
  long vowel / っ / voicing, look-alike on readings, same-okurigana verbs).
- **表記**: a natural sentence with one word from the notes written in hiragana in 【 】.
  4 spellings: the right one plus same-sound or same-shape swaps (2×2 grids for
  compounds, related-meaning kanji with the same okurigana for verbs and adjectives).
- Write every sentence new. The word comes from the notes; the sentence around it never
  copies the book's example phrases (not プレゼントを贈る for 贈る): new situation, new
  collocation where the word allows one.
- Use N2-level words; skip △ words unless the chapter runs short. Spread the questions
  over the chapter's lessons, and test each word only once per session.
- Each wrong choice must be wrong for anyone who knows the word. Skip words with two
  accepted readings.
- Spread answers over 1–4.

Write the whole set before asking. Keep the answers to yourself.

## 5. Ask and grade

Print the instruction line from `kanji-format.md` before each 大問 (all 漢字読み of a
chapter first, then its 表記). Ask with AskUserQuestion, up to 4 questions per call:

- `header`: `1章 問1` style (chapter + number), `question`: the sentence,
  `options`: `label` = `1　ようきゅう`, `description` = `選択肢1`, `multiSelect`: false.
- "Other" with a number 1–4 counts as that choice; anything else is no answer.

After each call, for each question:

- `問1 ○` or `問1 ×  あなた: 2　正解: 3 ようきゅう`
- For ×: the word, its reading and meaning, and in English which trap caught them
  (long vowel, っ, voicing, same-sound kanji, look-alike kanji…). Add a memory hook if
  there is a useful one (登録: 録 has 金, like recording onto metal).
- For ○: one short line.

Then the running score and the next call.

## 6. Save the misses

`~/Documents/JLPT 🇯🇵/N2/N2 漢字 ノート/苦手.md` holds every miss. Create it if missing:

```markdown
# 苦手な漢字

## 未克服

| 日付 | 章 | 単語 | 読み | 意味 | 間違い | 問題 |
|---|---|---|---|---|---|---|
| 2026-10-26 | 1章 | 招待 | しょうたい | invitation | しょたい（long vowel） | 漢字読み |

## 克服済み

| 日付 | 章 | 単語 | 読み | 意味 |
|---|---|---|---|---|
```

- After each graded call, add every miss to 未克服 (one row per word; if the word is
  already there, update the date and the 間違い column).
- In a `苦手` session, test each open word with a new sentence. A correct answer moves
  its row to 克服済み with today's date; a miss keeps it open.

## 7. Finish

- Score per chapter and total, with the percentage.
- The words missed this session (now in 苦手.md) and how many open entries 苦手.md has.
- Suggest the next chapters, or a `苦手` round if there are 10+ open entries.
