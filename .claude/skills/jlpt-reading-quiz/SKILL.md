---
name: jlpt-reading-quiz
description: Make a JLPT N2 reading set (短文, 中文, 統合理解, 主張理解, 情報検索, or a mix) in the real exam format and send it to the 文法ドリル app, which times each passage, grades it, highlights the sentence that proves each answer and names the trap of each wrong pick. Use when the user asks for reading (読解) practice, a reading set or a reading mock test in the app. For practice right here in the terminal, use jlpt-reading-quiz-terminal.
argument-hint: "[type: 短文 | 中文 | 統合 | 長文 | 情報検索 | 総合 | フル] [count, e.g. 3 sets]"
---

# JLPT N2 reading quiz (app)

Write original N2 reading passages like the real test, with every question's answer, the
sentence that proves it and the trap of every wrong choice, and send each set to the app.
The app times the user on each passage and shows the review.

## 1. Learn the format first

Read `~/.claude/skills/jlpt-reading-quiz-terminal/reading-format.md`. Every passage and
question must look like the official sample it records, and pass its checklist.

## 2. Read the request

Arguments: $ARGUMENTS

| The user asks for | One set holds |
|---|---|
| a type: `短文` | 2 passages × 1 question |
| `中文` | 1 passage × 3 questions (2 passages if they ask for a longer set) |
| `統合` | 1 pair A/B × 2 questions |
| `長文` (主張理解) | 1 passage × 3 questions |
| `情報検索` | 1 flyer or table × 2 questions |
| nothing, or `総合` | the daily set: 2 短文, 1 中文, and 1 of 統合 / 長文 / 情報検索 |
| `フル` | the whole section: 5 短文, 3 中文, 1 統合, 1 長文, 1 情報検索 (21 questions) |

A count ("3 sets") makes that many sets, each with new topics. Without one, make 1.

**Lean on the user's weak spots.** Read the log
`~/Documents/JLPT 🇯🇵/N2/N2 読解 ノート/記録.md` if it exists. Use it to pick topics not
used recently, and to lean the questions toward the kinds the user misses (理由, 指示語, 主張,
詳細, 比較, 条件). Its calibration rule applies too. This skill doesn't write to the log:
the app keeps the results.

**Title.** Use the type and a number: `短文 3`, `中文 1`, `総合 2`. A set of several types is
`総合 N`. Number each set after the ones of its type sent earlier in this conversation, or
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

- **Sections.** Use `reading-short` 短文, `reading-mid` 中文, `reading-integrated` 統合理解,
  `reading-claim` 主張理解 and `reading-info` 情報検索. Have one section per type, in that
  order.
- **Blocks.** A passage is a list of blocks:
  - **Essays, emails and notices:** 1 text block. Separate paragraphs with `\n`. An email's
    greeting and sign-off go on their own lines.
  - **統合理解:** 2 text blocks, `"label": "A"` and `"label": "B"`.
  - **情報検索:** a table block (`head` and `rows`, one cell per heading), plus text blocks
    for the notes and ※ footnotes.
- **Lead.** `lead` is the exam's line above a practical text:
  "以下は、ある会社が取引先に送ったメールの内容である。". An essay has none.
- **Underlines.** Mark them `<u>…</u>`, with ①② inside: `<u>①そうなると</u>`. The prompt
  repeats the underlined part inside `<u>…</u>`.
- **Notes.** `notes` are the （注）, words above N2 in the order they appear. Each word must be
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
