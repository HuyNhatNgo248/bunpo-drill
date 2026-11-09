---
name: jlpt-reading-quiz
description: Make a JLPT reading set for any level, N5 to N1 (短文, 中文, 長文, 統合理解, 主張理解, 情報検索, or a mix, as that level's exam has them), in the real exam format, and send it to the 文法ドリル app, which times each passage, grades it, highlights the sentence that proves each answer and names the trap of each wrong pick. Use when the user asks for reading (読解) practice, a reading set or a reading mock test in the app. For practice right here in the terminal, use jlpt-reading-quiz-terminal.
argument-hint: "[level: N5–N1, default N2] [type: 短文 | 中文 | 長文 | 統合 | 主張 | 情報検索 | 総合 | フル] [count, e.g. 3 sets]"
---

# JLPT reading quiz (app)

Write original reading passages like the real test of the level asked for, with every
question's answer, the sentence that proves it and the trap of every wrong choice, and send
each set to the app. The app times the user on each passage and shows the review.

## 1. Learn the format first

Read `~/.claude/skills/jlpt-reading-quiz-terminal/reading-format.md`. It records the
official N2 sample in detail: the writing style, the question kinds, the wrong-choice traps
and the checklist. Those apply at every level. Every passage must pass its checklist, with
the exceptions per level below.

Each level's exam has different 問題 and lengths. This is from the JLPT guide; re-check
the official samples on jlpt.jp (N1R.pdf … N5R.pdf) if anything looks off:

| Level | 問題 (passages × questions, length) | Language |
|---|---|---|
| N5 | 短文 3 × 1 (~80字) · 中文 1 × 2 (~250字) · 情報検索 1 × 1 (~250字) | です・ます, everyday topics, simple kanji |
| N4 | 短文 4 × 1 (100–200字) · 中文 1 × 3–4 (~450字) · 情報検索 1 × 2 (~400字) | everyday topics, plain or polite |
| N3 | 短文 4 × 1 (150–200字) · 中文 2 × 3 (~350字) · 長文 1 × 4 (~550字) · 情報検索 1 × 2 (~600字) | short essays, letters, notices |
| N2 | 短文 5 × 1 (~220字) · 中文 3 × 3 (~550字) · 統合理解 1 pair × 2 (~300字 each) · 主張理解 1 × 3 (~850字) · 情報検索 1 × 2 | see reading-format.md |
| N1 | 短文 4 × 1 (~200字) · 中文 3 × 3 (~500字) · 長文 1 × 4 (~1000字) · 統合理解 1 pair × 2–3 · 主張理解 1 × 4 (~1000字) · 情報検索 1 × 2 | abstract essays, reviews, more N1 words |

- **N5 and N4:** gloss fewer words, and put the writer's view near the end without heavy
  hedging. No 統合, 長文 or 主張 at these levels.
- **N3:** has 長文 (内容理解), but no 統合 or 主張.
- **"長文":** at N3 and N1 this means 内容理解（長文） (`@long`). At N2 there is no
  内容理解（長文）, so "長文" means 主張理解 (`@claim`).
- **Only the level's types:** the server rejects a type the level's exam doesn't have.

## 2. Read the request

Arguments: $ARGUMENTS

The level is the one named (N5–N1). If none is named, use N2. A set holds **5 passages**:

| The user asks for | One set holds |
|---|---|
| a type (`短文`, `中文`, `長文`, `統合`, `主張`, `情報検索`) | 5 passages of that type, each with the level's question count from the table above |
| nothing, or `総合` | one passage of each type the level has |
| `フル` | the level's whole exam section, as in the table above |

Fewer passages only when the user asks ("2 passages"). Targets per passage are set by the
app: 短文 2 min, 中文 6, 長文 10, 統合理解 6, 主張理解 10, 情報検索 6.

A count ("3 sets") makes that many sets, each with new topics. Without one, make 1.

**Lean on the user's weak spots.** Read the log
`~/Documents/JLPT 🇯🇵/N2/N2 読解 ノート/記録.md` if it exists. Use it to pick topics not
used recently, and to lean the questions toward the kinds the user misses (理由, 指示語, 主張,
詳細, 比較, 条件). Its calibration rule applies too. This skill doesn't write to the log:
the app keeps the results.

**Title.** Use the type and a number: `短文 3`, `中文 1`, `総合 2`. A set of several types is
`総合 N`. Numbers count per level, since the Reading tab lists each level on its own. Number each set after the ones of its type sent earlier in this conversation, or
that the user names. Otherwise start at 1. The Reading tab sorts by these numbers.

## 3. Write the passages

Follow `reading-format.md`: lengths, styles, question kinds, （注） glosses and wrong-choice
traps. Also:

- Original texts only. No author names, and no real people or companies.
- Vary the topics (work, technology, society, education, health, culture, environment,
  daily life), and mix practical texts (emails, notices) with essays.
- **Run the checklist in `reading-format.md` on every passage**, and rewrite it until it
  passes. The writer's view is hedged and in the second half. At least one answer is two or
  more sentences from its cue. Right answers paraphrase the text, and wrong ones reuse its
  words.

An audit against the official N2R/N3R samples (https://www.jlpt.jp/samples/sample2012/pdf/N2R.pdf)
found sets answerable without reading. These rules fix that:

- **Same-length choices.** The 4 choices are about the same length (within ~20%). The answer
  must not be the longest: it was in 77% of earlier N2 questions. `build.py` fails a set when the
  answer is the longest choice in more than 30% of its questions.
- **Believable wrong choices.** Each wrong choice is something a careless reader could take from
  the text: its own ideas, slightly twisted (a detail changed, a condition dropped, true but not
  what is asked). At most one `not-in-text` per question. No moral extremes or sweeping claims
  that no writer would make (`人に物を貸すべきではない`, `完璧を目指すのは、悪いことだ`).
- **Full lengths.** Meet the table's lengths, especially at N2: 中文 ~500字, 統合理解 ~270字 per
  text, 主張理解 ~850字. Shorter passages make the set easier than the exam.
- **Glosses.** N2 中文 and 主張理解 passages carry 3–5 （注）, as the exam's do.
- **統合理解** is not always "A for, B against". Often both writers agree on the main point and
  differ in a detail, reason or condition, as in the sample.
- **N2 情報検索** uses more than one source or plan (two companies, a table plus rules), and the
  answers combine options or turn on a ※ footnote, not one lookup and a sum.
- **指示語** questions ask what a reference word (この, それ, そう) points to.

## 4. Build the set's JSON

The contract is `test.schema.json` next to this file. It's generated from the app's
`app/lib/reading-payload.ts` by `pnpm schema`. Shape, cut down to one passage:

```json
{
  "version": 1,
  "kind": "reading",
  "title": "短文 1",
  "level": "N2",
  "sections": [
    {
      "type": "reading-short",
      "passages": [
        {
          "blocks": [
            { "kind": "text", "text": "道に迷うことは、もはやほとんどなくなった。…<u>しかし、私はときどき、あえてアプリを閉じて歩くことにしている</u>。…\n…迷う余地があってこそ生まれるものではないだろうか。…" }
          ],
          "notes": [{ "word": "余地", "gloss": "何かをすることができる余裕" }],
          "tip": "The writer's view comes after ただ near the end: read the underline, then jump to the last two sentences.",
          "questions": [
            {
              "id": "q1",
              "prompt": "<u>しかし、私はときどき、あえてアプリを閉じて歩くことにしている</u>とあるが、なぜか。",
              "choices": ["…悪いことだから", "…まったくないと思うから", "…道がはっきりしないときにあると思うから", "…必ず…出会えるから"],
              "answerIndex": 2,
              "kind": "理由",
              "traps": ["opposite", "over-general", null, "over-general"],
              "evidence": "ただ、知らない角を曲がって思いがけない店や景色に出会うといった経験は、迷う余地があってこそ生まれるものではないだろうか。",
              "explanation": "The ただ sentence says unplanned finds need room to get lost; 3 says it in other words. 1 is the opposite (それ自体は悪いことではない); 2 and 4 go too far (まったく, 必ず)."
            }
          ]
        }
      ]
    }
  ]
}
```

- **Sections.** Use `reading-short` 短文, `reading-mid` 中文, `reading-long` 長文,
  `reading-integrated` 統合理解, `reading-claim` 主張理解 and `reading-info` 情報検索. Have one
  section per type, in that order, and only the types the level has.
- **Blocks.** A passage is a list of blocks:
  - **Essays, emails and notices:** 1 text block. Separate paragraphs with `\n`. An email's
    greeting and sign-off go on their own lines.
  - **統合理解:** 2 text blocks, `"label": "A"` and `"label": "B"`.
  - **情報検索:** a table block (`head` and `rows`, one cell per heading), plus text blocks
    for the notes and ※ footnotes.
- **Lead.** `lead` is the exam's line above a practical text:
  "以下は、ある会社が取引先に送ったメールの内容である。". An essay has none.
- **Underlines.** Mark them `<u>…</u>`, with ①② inside: `<u>①そうなると</u>`. The prompt
  repeats the underlined part inside `<u>…</u>`. An evidence sentence that crosses an
  underline keeps the ① or ② that's inside it.
- **Notes.** `notes` are the （注）, words above the level in the order they appear. Each word must be
  in the passage.
- **Kinds.** `kind` is one of 理由, 指示語, 主張, 詳細, 比較, 条件.
- **Traps.** `traps` gives one per choice, in order: `null` for the right one, and for each
  wrong one `changed-detail`, `opposite`, `not-in-text`, `true-not-answer`, `over-general`
  or `missed-condition`.
- **Evidence.** `evidence` is the sentence, or table cell, that decides the answer, copied
  exactly from the passage without the `<u>` tags. It must appear once in the passage, so
  copy a longer part if it repeats. The results highlight it.
- **Explanation.** In English, 1–3 sentences: point at the evidence, then name what is wrong
  with each other choice.
- **Tip.** One English line on where this passage's answers are. The results show it when
  the user went over the target time.
- **Question ids** run q1, q2, … across the whole set, and start again at q1 in each new set.
  Spread the answers over 1–4.

### The short format (use it for every set)

Writing the JSON by hand is slow and easy to break. Write sets in this text format instead,
several sets per file, and let `build.py` (next to this file) turn them into the JSON, check
them and send them:

```text
### 短文 2
@short
L: 以下は、ある会社が取引先に送ったメールの内容である。
P: 一つの段落。<u>下線部</u>はこう書く。
P: 次の段落。
N: 咀嚼 = よく考えて理解すること
T: One English line on where this passage's answers are.
Q: <u>下線部</u>とあるが、なぜか。
1: 間違いの選択肢 ~ op
2*: 正解の選択肢
3: 間違いの選択肢 ~ cd
4: 間違いの選択肢 ~ ni
K: 理由
E: 本文から正確に写した根拠の文。
X: One or two English sentences: why 2 is right, what is wrong with the others.
```

- `LEVEL: N3`, right after the `###` line, sets the set's level. Without it, the level is N2.
- `@short` `@mid` `@long` `@int` `@claim` `@info` start a passage of that type. A 総合 set has
  passages of several types, and the script puts them in the exam's order.
- **Text lines:**
  - **`P:`** one paragraph.
  - **`A:` / `B:`** the two texts of 統合理解.
  - **`TH:` / `TR:`** a table's heading and rows, cells split by `|`.
  - **`F:`** a line of notes or ※ footnotes, shown under the table.
- `*` marks the answer. Each wrong choice ends with `~` and its trap: `cd` changed detail,
  `op` opposite, `ni` not in the text, `tn` true but not the answer, `og` over-general,
  `mc` missed condition.
- Question ids are numbered by the script, from q1 in each set.

```sh
python3 .claude/skills/jlpt-reading-quiz/build.py --dry sets.txt   # check only
python3 .claude/skills/jlpt-reading-quiz/build.py sets.txt         # check and send
```

The script reports any evidence that isn't found exactly once, any underline that isn't in
the passage, any question missing its answer or traps, and a set whose answers are too often
the longest choice. Fix those and run it again.

## 5. Send it

Write each set to `$TMPDIR/reading-<title>.json`, then run this from the app's folder
(`~/Downloads/bunpo-drill`):

```sh
bash .claude/skills/jlpt-reading-quiz/post.sh "$TMPDIR/reading-短文-1.json"
```

- **`check failed` or `POST … failed (400)`:** fix each path it lists and run it again. The
  server also checks the evidence, the traps, the underlines and the order of the sections.
- **Exit 2:** the app isn't running. Ask the user to start it with `pnpm dev` in
  `~/Downloads/bunpo-drill`, then retry.
- **`refused the API token`:** ask the user to set `BUNPO_API_TOKEN` in the repo's `.env`.
  Don't read or print the token yourself.

## 6. Reply

For each set, give its link from `post.sh`, its passages and questions, and its target time.
Mention that it also shows on the Reading tab (`localhost:3001/reading`). **Don't reveal
the answers in chat:** the user is about to take the set.
