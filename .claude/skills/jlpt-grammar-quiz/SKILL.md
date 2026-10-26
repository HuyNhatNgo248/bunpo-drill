---
name: jlpt-grammar-quiz
description: Make a JLPT-style grammar mock test (文法形式の判断, 文の組み立て, 文章の文法) from the user's N3/N2 文法ノート and send it to the 文法ドリル app with a POST request. Use when the user asks for a quiz, mock test, review test or practice questions on their grammar notes, by week (第5週), day (2日目), specific patterns, or "my weak ones". Default 15 questions per section (45 total); the user can set the count.
argument-hint: "[scope, e.g. 第5週 1〜3日目 | weak ones] [count, e.g. 10 per section | 30 questions | 20/10/5]"
---

# JLPT grammar quiz

Turn grammar points from the 文法ノート into one mock test in the **standard v1 payload**,
validate it and POST it to the app. Every test has the same shape: the same keys, the
same 3 sections in the same order, and sequential ids. Never invent fields or reorder anything.

## 1. Read the request

Arguments: $ARGUMENTS

Settle three things from the arguments and the conversation:

- **Level**: N3 or N2. Default N3 (the N2 notes have no lessons written yet).
- **Scope**: weeks, days or specific patterns. "Weak ones" means the unreviewed chips:
  `bash ~/.claude/skills/jlpt-grammar-quiz/tests.sh` (it sends the app's API token) and collect `review[]` entries with
  `"reviewed": false`. Their `grammarId` (`n3-w5-d1-g2`) gives week, day and number.
  If no scope is given, ask once ("Which week or days?"). Don't guess.
- **Question count**, per section as fill-blank / sentence-order / passage blanks:

  | The user says | Counts |
  |---|---|
  | nothing | **15 / 15 / 15** (45 questions), the default |
  | "10 per section", "10 each" | 10 / 10 / 10 |
  | "30 questions", "30問" (a total) | split evenly; any remainder goes to fill-blank first, then sentence-order (31 → 11 / 10 / 10) |
  | "20/10/5", "fill 20, order 10, passage 5" | exactly that |

  Each section needs at least 1 question and at most 30. All 3 sections are always present.
  If the user asks for fewer than 3 questions or more than 30 in a section, explain the
  limit and use the nearest allowed count.

## 2. Read the notes

Notes live in `~/Documents/JLPT 🇯🇵/<level>/<level> 文法 ノート/`:

| File | What's in it |
|---|---|
| `第N週.md` | Full lessons. Each grammar point is a block `<!-- lesson:w5-d1-g2 start -->` … `end -->` under a heading `## 1日目 ② 「〜ばかりか」`, with How to connect, What it means, a **Nuance** table of look-alike patterns, and 例文 10. |
| `文型リスト.md` | Every pattern in the book per week/day with its meaning and ✅ progress. Use it to map a pattern to week/day/number. |

Map each heading to a grammar point: `## 1日目 ② 「〜ばかりか」` in `第5週.md` is
week 5, day 1, number 2 → id `n3-w5-d1-g2`, pattern `〜ばかりか`. Take `meaning` from the
italic gloss under the heading (`*not only does it taste bad, but…*` → `not only … but also`).

Read the lesson block of every point you test. Use its connection rules and ⚠ traps for
distractors, and its Nuance table for look-alike choices. Only test points that have a
lesson block (they've been studied), unless the user asks for points from 文型リスト.md.

## 3. Lay out the test

| Section | `type` | Default | Question ids |
|---|---|---|---|
| 問題1 文法形式の判断 | `fill-blank` | 15 questions | q1–q15 |
| 問題2 文の組み立て | `sentence-order` | 15 questions | q16–q30 |
| 問題3 文章の文法 | `passage` | 3 passages × 5 blanks | q31–q45 |

- Ids run q1, q2, … through all sections with no gaps, so with custom counts they shift
  (10 / 10 / 10 → q1–q10, q11–q20, q21–q30).
- Passage blanks come in passages of at most 5: use as few passages as possible and spread
  the blanks evenly (15 → 5+5+5, 12 → 4+4+4, 7 → 4+3, 3 → one passage of 3).
- Every grammar point in `grammarPoints` is tested at least once, and `grammarPoints` lists
  only the points the test uses. Spread the questions evenly over the points, and test each
  point in more than one section where you can. If there are more points than questions,
  ask whether to raise the count or narrow the scope.
- **Title**: `第5週 1日目`, `第5週 2〜3日目`, `第3週・第5週`, or `苦手な文法` for weak ones (max 60 characters).

## 4. Write the questions

Write natural Japanese at the test's level, with ordinary kanji and no furigana or English inside Japanese fields.
No two questions in a test may share a sentence or a passage.
Write every sentence and passage new. Never reuse the notes' or the book's 例文, not even with a
word or two swapped: new situation, new subject, new wording. The notes tell you what to test
(rules, traps), not the text.

**fill-blank (文法形式の判断)**
- One sentence whose blank is exactly `（　　）` (full-width parentheses around two full-width spaces).
- 4 choices with the same shape (all particles+verbs, all conjugated forms…). Take them from the
  point's Nuance table and the same week. Exactly one is correct. Each wrong choice fails for a
  reason the notes teach: wrong connection (〜はもちろん after a verb without の), wrong
  meaning, or wrong direction.

**sentence-order (文の組み立て)**
- `before` + 4 slots + `after` make one sentence. Use 4 short chunks, like the real exam (`冷めない` `うちに` `早く` `食べて`).
- Only one order may be grammatical. Check every order that could plausibly work.
- `pieces` are scrambled. `correctOrder` lists piece indices (0-based) in slot order.
  `starSlot` is the 1-based slot holding ★ (vary it, often 3). Only the ★ piece is graded,
  so it must be fixed by the grammar, not by taste.

**passage (文章の文法)**
- Each passage is 4–7 sentences (about 150–300 characters) of essay or diary style, on its own
  topic. The blanks test the grammar points or a connective that depends on the flow (だから vs ところが).
- Write each blank as `[n]` where n is the question number (q31 → `[31]`), and set `blank` to the same n.

**For all types**
- Spread `answerIndex` (and the ★ piece's position in `pieces`) evenly over 0–3, and don't let
  the right answer always be the longest.
- Read every sentence once with each choice. If two choices work, rewrite the question.

## 5. Build the payload

Use exactly this structure, keys in this order. The example below is cut down to 4 / 2 / 2
to show the shape; a real test uses the counts from step 1.

```json
{
  "version": 1,
  "title": "第5週 1日目",
  "level": "N3",
  "grammarPoints": [
    { "id": "n3-w5-d1-g1", "week": 5, "day": 1, "number": 1, "pattern": "〜はもちろん", "meaning": "not to mention; A of course, and B too" },
    { "id": "n3-w5-d1-g2", "week": 5, "day": 1, "number": 2, "pattern": "〜ばかりか", "meaning": "not only … but also" },
    { "id": "n3-w5-d1-g3", "week": 5, "day": 1, "number": 3, "pattern": "〜に比べて", "meaning": "compared with" },
    { "id": "n3-w5-d1-g4", "week": 5, "day": 1, "number": 4, "pattern": "〜に対して", "meaning": "toward; in contrast to" }
  ],
  "sections": [
    {
      "type": "fill-blank",
      "questions": [
        { "id": "q1", "grammarId": "n3-w5-d1-g1", "prompt": "この店は、平日（　　）、週末もとても混んでいる。", "choices": ["に対して", "について", "はもちろん", "として"], "answerIndex": 2 },
        { "id": "q2", "grammarId": "n3-w5-d1-g2", "prompt": "あの店の料理はおいしくない（　　）、値段もとても高い。", "choices": ["はもちろん", "ばかりか", "に比べて", "に対して"], "answerIndex": 1 },
        { "id": "q3", "grammarId": "n3-w5-d1-g3", "prompt": "今年の夏は、去年（　　）雨が少なかった。", "choices": ["に対して", "ばかりか", "はもちろん", "に比べて"], "answerIndex": 3 },
        { "id": "q4", "grammarId": "n3-w5-d1-g4", "prompt": "田中先生は、どの学生（　　）も同じように優しい。", "choices": ["に対して", "に比べて", "について", "によって"], "answerIndex": 0 }
      ]
    },
    {
      "type": "sentence-order",
      "questions": [
        { "id": "q5", "grammarId": "n3-w5-d1-g2", "before": "この薬は", "after": "ある。", "pieces": ["まで", "効かない", "副作用", "ばかりか"], "correctOrder": [1, 3, 2, 0], "starSlot": 3 },
        { "id": "q6", "grammarId": "n3-w5-d1-g1", "before": "彼女は英語", "after": "そうだ。", "pieces": ["話せる", "まで", "はもちろん", "中国語"], "correctOrder": [2, 3, 1, 0], "starSlot": 2 }
      ]
    },
    {
      "type": "passage",
      "passages": [
        {
          "passage": "私が住んでいる町は、十年前[7]ずいぶん便利になった。駅前に大きなスーパーや病院ができて、生活がとても楽になった。若い人たちがその便利さを喜んでいる[8]、お年寄りの中には、昔の静かな町をなつかしく思う人も多い。町が変わることは、いいことばかりではないのかもしれない。",
          "questions": [
            { "id": "q7", "blank": 7, "grammarId": "n3-w5-d1-g3", "choices": ["に対して", "に比べて", "はもちろん", "ばかりか"], "answerIndex": 1 },
            { "id": "q8", "blank": 8, "grammarId": "n3-w5-d1-g4", "choices": ["ばかりか", "はもちろん", "のに対して", "に比べて"], "answerIndex": 2 }
          ]
        }
      ]
    }
  ]
}
```

The full contract is `schema.json`, which is generated from the app's Zod schema
(`app/lib/payload.ts`; regenerate with `pnpm schema`). The server also enforces:
grammar ids match level/week/day/number; every question's `grammarId` is listed and every
listed point is tested; ids run q1, q2, … with no gaps; `（　　）` appears exactly once in
a prompt; a question's 4 options are all different; `correctOrder` is a permutation of
0–3; each passage has exactly one `[n]` per question of that passage, in order.

## 6. Send it

1. Write the JSON to a temp file (for example `$TMPDIR/bunpo-<timestamp>.json`).
2. Run `bash ~/.claude/skills/jlpt-grammar-quiz/post.sh <file>` (works from any directory).
   - `schema.json check failed` or `POST /api/tests failed (400)`: fix each listed path and run it again.
   - A `Note: … not the standard 15 / 15 / 15` line is only a reminder. Ignore it if the user asked for other counts.
   - Exit 2 (app not running): ask the user to start it with `pnpm dev` in `~/Downloads/bunpo-drill` (or start it yourself if they agree), then retry.
   - `refused the API token`: ask the user to set `BUNPO_API_TOKEN` in the repo's `.env` to the app's value. Don't read or print the token yourself.
3. Reply with the test link and what it covers (weeks/days, question counts per section).
   **Don't reveal the answers in chat.** The user is about to take the test.
