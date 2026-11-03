# Subscription plan

Goal: open the app to the public in 2027. Reach 50 paying users in the first year.

## Math

- 50 × 700 yen = 35,000 yen a month.
- Only 2–5% of free users usually pay.
- So we need about 1,000–2,500 active free users in the year.

## Plans

**Free**
- 1–2 full tests per level.
- Progress is saved.

**Monthly: 700 yen in year 1, then 900 yen from year 2**
- All tests, N5 to N1.
- Cancel any time.
- 7-day free trial.
- Stay at 900. No yearly raises.
- Old users keep their price when it goes up.

**6 months: 3,500 yen in year 1, then 4,500 yen from year 2**
- About 17% off the monthly price.
- Covers one exam cycle.
- Paid up front, so quitting after the exam hurts less.

**Early members**
- First 50 users pay 500 yen a month for as long as they stay subscribed.

**Price raise to 900**
- Raise it in January 2028, right after the December exam.
- Announce it 1–2 months ahead.
- Add many new tests before the raise.

**Maybe later: Pro plan, 1,200 yen**
- Extras like listening (聴解), full timed mock exams with a score guess, AI explanations.
- Better than raising the base price.

Skip for now:
- Yearly plan. Most people study for one exam, then stop.
- Per-level plans like "N2 only." More work, and smaller plans make 700 yen feel worse.

## Forecast (guesses, not data)

Assumes launch in January 2027 and steady promotion. Income is after Stripe fees, before server costs and tax.

- Year 1 (2027): about 50 paying users at peak. About 180,000 yen a year.
- Year 2 (2028): about 95 at peak. About 550,000 yen a year.
- Year 3 (2029): about 145 at peak. About 1,060,000 yen a year.
- Year 4 (2030): about 200 at peak. About 1,550,000 yen a year.

Users peak in May–June and October–November, then drop after each exam.

Assumptions:
- Free sign-ups: about 100 a month in year 1, about 300 before exams, growing about 1.5 times a year.
- Paying rate: about 3% at 700 yen, about 2.5% at 900 yen.
- About 10% of paying users cancel each month, and about 30% right after each exam.

Ways to grow much faster (1,000 users, or 4,000,000 yen a year):
- Deals with sending agencies and language schools (worker visas need N4/N3).
- A Vietnamese version of the app.
- A YouTuber deal or a viral short video.
- Ranking on Google for "JLPT N2 mock test" type searches.
- A phone app.

## Tax

- Side income over 200,000 yen a year needs a tax return (確定申告). Likely from year 2.
- Check whether your job allows side income (副業).

## Payments

- Stripe Checkout plus Stripe's billing page. No custom plan-change or cancel screens.
- Stripe fee in Japan is about 3.6%.
- Add a 特定商取引法に基づく表記 page (seller info page required by law). Stripe asks for it too.

## Getting users

- JLPT is in July and December. Most people pay 1–2 months before. Promote then.
- Post in r/LearnJapanese, JLPT Facebook and Discord groups, and short videos on X or TikTok (one question plus its explanation).
- Main pitch: real exam-style tests, N5 to N1. Bunpro is about 750 yen a month for grammar only.

## Risks

- Users cancel right after the exam.
- Not enough tests per level, especially N5 and N1. Check this before launch.
- Many free apps and Anki decks exist. Our edge is tests that match the real exam.

## Before launch

- [ ] Count tests per level. Fill gaps.
- [ ] Decide which tests are free.
- [ ] Add paid-content gating.
- [ ] Set up Stripe plans and the billing page.
- [ ] Add the 特定商取引法 page.
