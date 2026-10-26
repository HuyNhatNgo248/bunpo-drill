# JLPT N2 kanji questions: the real format

Source: the official N2 sample test, `https://www.jlpt.jp/samples/sample2012/pdf/N2V.pdf`
(pages 5–6) and `N2answer.pdf`. Re-check there if anything looks off.

## Counts

| 大問 | Questions | Answers in the sample |
|---|---|---|
| 問題1 漢字読み | 5 | 2 3 1 4 3 |
| 問題2 表記 | 5 | 3 2 1 4 2 |

Every question has 4 choices, numbered 1–4. One short sentence per question, with the
target word underlined. Other hard kanji in the sentence get furigana (in the terminal,
just avoid kanji above N2 outside the target).

## Instructions, word for word

- 問題1: ＿＿＿の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。
- 問題2: ＿＿＿の言葉を漢字で書くとき、最もよいものを1・2・3・4から一つ選びなさい。

## 漢字読み: the 5 sample questions and their traps

| Sentence (target) | Choices | Trap type |
|---|---|---|
| 最後の試合で<u>敗れて</u>しまった | たおれて / **やぶれて** / みだれて / つぶれて | kun readings of other verbs with the same ending and a related meaning |
| 高い語学力が<u>要求</u>される | ようきゅ / よっきゅう / **ようきゅう** / よっきゅ | long vowel × small っ, a 2×2 grid |
| 合格をみんなで<u>祝った</u> | **いわった** / いのった / うらなった / ねがった | verbs from the same meaning area (pray, wish, tell fortunes) |
| 温度を<u>調節</u>してください | ちょうさい / ちょうせい / ちょうさつ / **ちょうせつ** | the second kanji's on reading swapped for similar ones (せい/せつ, さい/さつ) |
| 書類を<u>至急</u>コピーして | しっきゅう / ちっきゅう / **しきゅう** / ちきゅう | small っ × first consonant (し/ち), a 2×2 grid |

So the wrong readings are:
- **2×2 grids**: two independent traps crossed (long/short vowel × っ, voiced/unvoiced ×
  long/short, し/ち × っ). Exactly one cell is right.
- **Look-alike on readings** of the same kanji shape family: せい/せつ, さい/さつ, こう/こ.
- **Kun-reading verbs** that share okurigana and sound plausible: all 〜れて, all 〜った.

## 表記: the 5 sample questions and their traps

| Sentence (target in hiragana) | Choices | Trap type |
|---|---|---|
| 平和の<u>しょうちょう</u>だ | 像徴 / 象微 / **象徴** / 像微 | 2×2 grid of look-alikes (像/象 same sound, 徴/微 same shape) |
| <u>はげしい</u>運動はしないで | 険しい / **激しい** / 暴しい / 極しい | same okurigana, kanji with related meaning |
| 電話番号を<u>とうろく</u>した | **登録** / 登緑 / 答録 / 答緑 | 2×2 grid (登/答 same sound トウ, 録/緑 same shape) |
| 話題の映画に<u>さそった</u> | 招った / 勧った / 請った / **誘った** | verbs with related meaning, same okurigana |
| 時間を6時に<u>へんこう</u>して | 変改 / **変更** / 変換 / 変替 | same first kanji, second kanji a synonym that also means "change" |

So the wrong spellings are:
- **2×2 grids**: kanji 1 swapped for a same-sound kanji, kanji 2 swapped for a same-shape
  kanji. Most common for 2-kanji words.
- **Same okurigana, related-meaning kanji** for verbs and adjectives.
- **Real words as traps**: some wrong choices are real words with a different meaning
  (変換 = conversion), so the learner has to know the exact word, not just "a kanji
  meaning change".

## What this means when writing questions

- One natural sentence, target word underlined (in the terminal: wrap it in ＿ or 【 】).
- Build distractors with the patterns above, mostly 2×2 grids for compounds and
  same-okurigana swaps for verbs and adjectives.
- Wrong choices must be clearly wrong to someone who knows the word, never a valid
  alternative reading or spelling (no 寄贈 きぞう/きそう style both-correct traps).
- Spread answers over 1–4 with no pattern.
