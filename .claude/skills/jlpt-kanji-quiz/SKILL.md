---
name: jlpt-kanji-quiz
description: Send a chapter of the user's kanji book for any JLPT level, N5 to N1, to the 文法ドリル app as flashcards, and make a kanji mock test on it in that level's real exam format (漢字読み and 表記; 漢字読み only at N1) that the app shows and grades. Use when the user asks for a kanji quiz, kanji test or kanji flashcards in the app, by level and chapter (N3 1章, N5 第3課, 3〜5章), or asks to send a chapter's words or cards. For a quiz right here in the terminal, use jlpt-kanji-quiz-terminal.
argument-hint: "[level, e.g. N5 | N3 | N2] [chapters, e.g. 1章 | 1〜3章 | 第3課] [cards only] [count, e.g. 10 per part]"
---

# JLPT kanji quiz (app), N5 to N1

For each chapter asked for: make sure its notes exist, send its words to the app (they are
the chapter's flashcards), then write one mock test on it and send that too. The app keeps
which words are learned; a quiz miss puts the word back among the cards to learn.

## Levels and books

Every level works the same way; only the book, the notes folder and the exam format change.
`<JLPT>` is `~/Documents/JLPT 🇯🇵`.

| Level | Book | A "chapter" is | Notes folder |
|---|---|---|---|
| N5 | `<JLPT>/N5 & N4/sach kanji I & II/Minna no Nihongo I - Kanji Renshuuchou.pdf` | a 課 (第1〜25課) | `<JLPT>/N5 & N4/N5 漢字 ノート/` |
| N4 | `<JLPT>/N5 & N4/sach kanji I & II/Minna no Nihongo II - Kanji Renshuuchou.pdf` | a 課 (第26〜50課) | `<JLPT>/N5 & N4/N4 漢字 ノート/` |
| N3 | `<JLPT>/N3/N3 漢字マスター.pdf` | a 章 | `<JLPT>/N3/N3 漢字 ノート/` |
| N2 | `<JLPT>/N2/N2 漢字マスター.pdf` | a 章 (1〜19) | `<JLPT>/N2/N2 漢字 ノート/` |
| N1 | none on disk yet | — | `<JLPT>/N1/N1 漢字 ノート/` |

- **N1**: there is no book yet. Ask the user for the PDF's path once, add it to this table,
  and go on. Never make up chapters or words without a book.
- **A book's contents**: the N2 page table is in step 3 of
  `../jlpt-kanji-quiz-terminal/SKILL.md`. For any other book, the first time, read its
  contents pages and save them as `目次.md` in the notes folder: each chapter's number,
  title and lesson pages, and how PDF pages map to book pages. Read `目次.md` after that.
- **Chapter numbers** go in the app as plain numbers: N5 第3課 is chapter 3, N4 第27課 is 27.

## 1. Read the request

Arguments: $ARGUMENTS

- **Level**: N5, N4, N3, N2 or N1. If none is given, use the level of the chapter files
  named, else ask once. Default to N2 only when the user is plainly continuing N2 work.
- **Chapters**: `1章`, `1〜3章`, `第3課`; for N2 also `基本編` (1–10) and `挑戦編` (11–19),
  and skip 19章 (地名) unless asked. If nothing is given, ask once which chapters.
- **cards only** ("just the flashcards", "send the words"): steps 2–3, no test.
- **Count**: per test, about 45 questions (22 漢字読み + 23 表記; at N1 up to 30 漢字読み): every
  kanji of the chapter at least once, then more of its words, each word once. "10 per part"
  → 10 + 10; "20 questions" → 10 + 10. At most 30 per part. A small chapter (a few kanji, as
  in the N5 book) gets fewer: every word it has, once. One test per chapter, never one test over
  several chapters: the app shows each chapter's newest test on its row.

## 2. The chapter's notes

Notes live in the level's notes folder (table above) as `第N章.md` (`第N課.md` for N5 and
N4). Follow step 3 of `../jlpt-kanji-quiz-terminal/SKILL.md` (next to this skill) for the
notes format and the rules for reading the scan, with the level in place of N2: example
sentences at the level, using only kanji of the level or below. This skill needs the full
format: stroke counts, a meaning per word, three `例：` sentences per kanji and a 他の漢字
section. If the file is missing, or is in the older format without them, read the
chapter's pages and write or complete it.

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
          ],
          "examples": [
            { "sentence": "友人の結婚祝いに、ペアのグラスを【贈った】。", "meaning": "I gave my friend a pair of glasses as a wedding present." },
            { "sentence": "母の日の【贈り物】に、カーネーションの花束を選んだ。", "meaning": "For Mother's Day, I chose a bouquet of carnations as a present." },
            { "sentence": "お中元の【贈答品】には、毎年同じお菓子を選んでいる。", "meaning": "Every year I choose the same sweets as our summer gift." }
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

- `level` is the chapter's level; `title` is the chapter's title in the book (`生活-1`; for a
  課 with no title, `第3課`).
- One lesson per page, in the book's order; one entry per kanji with its words in the
  book's order. `rare: true` for a △ word. A word with two readings in the book (きぞう／きそう)
  takes the first.
- `examples` are the kanji's three `例：` lines from the notes: the sentence with its
  【 】, and its English. The flashcards of the kanji's words show them.
- `otherKanji` lists every kanji in the words that is not a headword of the chapter.
- The server checks that each word contains its headword, that no word is in the chapter
  twice, that every kanji has its readings, and that every example has one 【…】 around a
  word with its kanji.

Write it to a temp file (`$TMPDIR/kanji-chapter-<level>-<N>.json`) and run, from the app's folder
(`~/Downloads/bunpo-drill`):

```sh
bash .claude/skills/jlpt-kanji-quiz/post.sh chapter "$TMPDIR/kanji-chapter-<level>-<N>.json"
```

Sending a chapter again replaces its words and keeps their learned marks, so resend it
whenever the notes change.

## 4. Write the questions

Read the level's format file first. `../jlpt-kanji-quiz-terminal/kanji-format.md` is N2's,
from the official sample. For another level, read `kanji-format-<level>.md` next to it; if
it is missing, write it the same way from that level's official sample test
(`https://www.jlpt.jp/samples/forlearners.html`, the 言語知識 PDF and its answers): the
questions per part, the instructions word for word, the sample questions and their traps,
and how the sentences are written. What changes by level:

- **N5 and N4**: the parts are 「かんじよみ」 and 「ひょうき」. Sentences are short and
  everyday, with spaces between phrases as the paper prints them, and any word above the
  level in hiragana. Traps are simpler: voicing, long vowels, っ, and look-alike kanji of
  the same level.
- **N3 and N2**: the same parts and traps as `kanji-format.md`; N3 has its own counts and
  sample, so it gets its own file too.
- **N1**: 漢字読み only. There is no 表記 part in the N1 exam, so send one section.

Then:

- **漢字読み** (`kanji-reading`): a natural sentence with one chapter word in 【 】, written
  in kanji (a verb may be conjugated: 【届けて】). 4 readings in hiragana: the right one and
  traps from the format file (2×2 grids of long vowel / っ / voicing, look-alike on
  readings, same-okurigana verbs).
- **表記** (`kanji-writing`, not at N1): a natural sentence with one chapter word in 【 】, written in
  hiragana. 4 spellings, each with kanji: the right one and same-sound or same-shape swaps.
- Write every sentence new: never the book's example phrases, not even with a word swapped,
  nor the notes' `例：` sentences, which the flashcards show.
- Words at the test's level; skip △ words unless the chapter runs short. Outside 【 】, use
  only kanji at the level or below. Spread the questions over the
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
  word's id is `<level>-c<chapter>-<word>` in lower case: `n2-c1-招待状`, `n5-c3-学校`.
- `sections` is `[kanji-reading, kanji-writing]`; at N1 only `[kanji-reading]`.
- Ids run q1, q2, … through both parts with no gaps.
- **Title**: the chapter and its title: `1章 生活-1`, `第3課`.
- The server also checks that the chapter was sent (step 3) and that every word is in it.

Write it to `$TMPDIR/kanji-test-<level>-<N>.json` and run
`bash .claude/skills/jlpt-kanji-quiz/post.sh test "$TMPDIR/kanji-test-<level>-<N>.json"`.

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
