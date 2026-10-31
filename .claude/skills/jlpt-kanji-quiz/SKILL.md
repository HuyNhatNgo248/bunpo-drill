---
name: jlpt-kanji-quiz
description: Send a chapter of the user's 漢字マスターN2 book to the 文法ドリル app as flashcards, and make a JLPT N2 kanji mock test on it (漢字読み and 表記, the real exam format) that the app shows and grades. Use when the user asks for a kanji quiz, kanji test or kanji flashcards in the app, by chapter (1章, 3〜5章), or asks to send a chapter's words or cards. For a quiz right here in the terminal, use jlpt-kanji-quiz-terminal.
argument-hint: "[chapters, e.g. 1章 | 1〜3章] [cards only] [count, e.g. 10 per part]"
---

# JLPT N2 kanji quiz (app)

For each chapter asked for: make sure its notes exist, send its words to the app (they are
the chapter's flashcards), then write one mock test on it and send that too. The app keeps
which words are learned; a quiz miss puts the word back among the cards to learn.

## 1. Read the request

Arguments: $ARGUMENTS

- **Chapters**: `1章`, `1〜3章`, `基本編` (1–10), `挑戦編` (11–19). Skip 19章 (地名) unless
  asked. If nothing is given, ask once which chapters.
- **cards only** ("just the flashcards", "send the words"): steps 2–3, no test.
- **Count**: per test, 5 漢字読み + 5 表記 (q1–q10), as in the exam. "10 per part" → 10 + 10;
  "20 questions" → 10 + 10. At most 30 per part. One test per chapter, never one test over
  several chapters: the app shows each chapter's newest test on its row.

## 2. The chapter's notes

Notes live in `~/Documents/JLPT 🇯🇵/N2/N2 漢字 ノート/第N章.md`. Follow step 3 of
`../jlpt-kanji-quiz-terminal/SKILL.md` (next to this skill): it has the page of every
chapter, the notes format and the rules for reading the scan. This skill needs the full
format: stroke counts, a meaning per word and a 他の漢字 section. If the file is missing,
or is in the older format without them, read the chapter's pages and write or complete it.

The book is a scan, read with the Read tool's `pages` parameter. If Read says `pdftoppm is
not installed`, ask the user to run `! brew install poppler` and wait.

Never send a word marked `⚠要確認`.

## 3. Send the chapter's words

Build the chapter JSON from the notes. The contract is `chapter.schema.json` (generated from
the app's `app/lib/kanji-payload.ts` by `pnpm schema`):

```json
{
  "version": 1,
  "level": "N2",
  "chapter": 1,
  "title": "生活-1",
  "lessons": [
    {
      "title": "ギフト",
      "page": 20,
      "kanji": [
        {
          "char": "贈",
          "strokes": 18,
          "kun": ["おく-る"],
          "on": ["ゾウ", "ソウ"],
          "words": [
            { "word": "贈る", "reading": "おくる", "meaning": "to give as a gift" },
            { "word": "贈答品", "reading": "ぞうとうひん", "meaning": "gifts, given and received" },
            { "word": "寄贈", "reading": "きぞう", "meaning": "donation", "rare": true }
          ]
        }
      ]
    }
  ],
  "otherKanji": [
    { "char": "答", "kun": ["こた-える", "こた-え"], "on": ["トウ"] },
    { "char": "品", "kun": ["しな"], "on": ["ヒン"] },
    { "char": "寄", "kun": ["よ-る", "よ-せる"], "on": ["キ"] }
  ]
}
```

- One lesson per page, in the book's order; one entry per kanji with its words in the
  book's order. `rare: true` for a △ word. A word with two readings in the book (きぞう／きそう)
  takes the first.
- `otherKanji` lists every kanji in the words that is not a headword of the chapter.
- The server checks that each word contains its headword, that no word is in the chapter
  twice, and that every kanji has its readings.

Write it to a temp file (`$TMPDIR/kanji-chapter-<N>.json`) and run, from the app's folder
(`~/Downloads/bunpo-drill`):

```sh
bash .claude/skills/jlpt-kanji-quiz/post.sh chapter "$TMPDIR/kanji-chapter-<N>.json"
```

Sending a chapter again replaces its words and keeps their learned marks, so resend it
whenever the notes change.

## 4. Write the questions

Read `../jlpt-kanji-quiz-terminal/kanji-format.md` for the real format and its traps, then:

- **漢字読み** (`kanji-reading`): a natural sentence with one chapter word in 【 】, written
  in kanji (a verb may be conjugated: 【届けて】). 4 readings in hiragana: the right one and
  traps from the format file (2×2 grids of long vowel / っ / voicing, look-alike on
  readings, same-okurigana verbs).
- **表記** (`kanji-writing`): a natural sentence with one chapter word in 【 】, written in
  hiragana. 4 spellings, each with kanji: the right one and same-sound or same-shape swaps.
- Write every sentence new: never the book's example phrases, not even with a word swapped.
- N2-level words; skip △ words unless the chapter runs short. Spread the questions over the
  chapter's lessons, and test each word once per test.
- Each wrong choice must be wrong for anyone who knows the word; skip words with two
  accepted readings. Spread the answers over 1–4.
- Give every question an `explanation`: one or two English sentences on why the answer is
  right and which trap the others set (`渡航 is とこう: 渡 is a short ト. A long-vowel trap.`).

## 5. Send the test

The contract is `test.schema.json`. Shape, cut down to 1 + 1 questions:

```json
{
  "version": 1,
  "kind": "kanji",
  "title": "1章 生活-1",
  "level": "N2",
  "chapter": 1,
  "words": [
    { "id": "n2-c1-招待状", "word": "招待状", "reading": "しょうたいじょう" },
    { "id": "n2-c1-乗車券", "word": "乗車券", "reading": "じょうしゃけん" }
  ],
  "sections": [
    {
      "type": "kanji-reading",
      "questions": [
        { "id": "q1", "wordId": "n2-c1-招待状", "prompt": "取引先から新年会の【招待状】をいただいた。", "choices": ["しょたいじょう", "しょだいじょう", "しょうたいじょう", "しょうだいじょう"], "answerIndex": 2, "explanation": "招待 is しょうたい, with a long しょう. A long-vowel trap." }
      ]
    },
    {
      "type": "kanji-writing",
      "questions": [
        { "id": "q2", "wordId": "n2-c1-乗車券", "prompt": "駅の窓口で【じょうしゃけん】を買った。", "choices": ["乗車巻", "乗者券", "乗車券", "乗者巻"], "answerIndex": 2, "explanation": "券 (ticket) has 刀 at the bottom; 巻 (roll) has 己. A look-alike trap." }
      ]
    }
  ]
}
```

- `words` lists exactly the words the test uses, written and read as in the chapter. A
  word's id is `<level>-c<chapter>-<word>` in lower case: `n2-c1-招待状`.
- Ids run q1, q2, … through both parts with no gaps.
- **Title**: `1章 生活-1` (the chapter and its title).
- The server also checks that the chapter was sent (step 3) and that every word is in it.

Write it to `$TMPDIR/kanji-test-<N>.json` and run
`bash .claude/skills/jlpt-kanji-quiz/post.sh test "$TMPDIR/kanji-test-<N>.json"`.

For either kind of file:

- **`check failed` or `POST … failed (400)`**: fix each listed path and run it again.
- **Exit 2**: the app isn't running. Ask the user to start it with `pnpm dev` in
  `~/Downloads/bunpo-drill`, then retry.
- **`refused the API token`**: ask the user to set `BUNPO_API_TOKEN` in the repo's `.env`.
  Don't read or print the token yourself.

## 6. Reply

For each chapter: the flashcards link and the test link from `post.sh`, the number of words
sent, and the question counts. **Don't reveal the answers in chat.** The user is about to
take the test.
