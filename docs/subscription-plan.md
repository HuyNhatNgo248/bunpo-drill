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

**Monthly: 700 yen**
- All tests, N5 to N1.
- Cancel any time.
- 7-day free trial.

**6 months: 3,500 yen**
- About 580 yen a month (about 17% off).
- Covers one exam cycle.
- Paid up front, so quitting after the exam hurts less.

**Early members**
- First 50 users pay 500 yen a month for as long as they stay subscribed.

Skip for now:
- Yearly plan. Most people study for one exam, then stop.
- Per-level plans like "N2 only." More work, and smaller plans make 700 yen feel worse.

## Payments

- Stripe Checkout plus Stripe's billing page. No custom plan-change or cancel screens.
- Stripe fee in Japan is about 3.6%.
- Add a 特定商取引法に基づく表記 page (seller info page required by law). Stripe asks for it too.

## Getting users

- JLPT is in July and December. Most people pay 1–2 months before. Promote then.
- Post in r/LearnJapanese, JLPT Facebook and Discord groups, and short videos on X or TikTok (one question plus its explanation).
- Main pitch: real exam-style tests, N5 to N1. Cheaper than Bunpro (about 750 yen a month, grammar only).

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
