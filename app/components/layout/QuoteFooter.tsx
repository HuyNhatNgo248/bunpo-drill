// Proverbs, so no author to credit.
const QUOTES = [
  ["千里の道も一歩から", "A journey of a thousand miles starts with one step."],
  ["七転び八起き", "Fall seven times, get up eight."],
  ["継続は力なり", "Persistence is power."],
  ["初心忘るべからず", "Never forget your beginner's mind."],
  ["石の上にも三年", "Perseverance wins in the end."],
  ["塵も積もれば山となる", "Even dust, piled up, becomes a mountain."],
  ["習うより慣れよ", "Get used to it, rather than just learning it."],
];

export function QuoteFooter() {
  // Same quote all day, so server and browser agree.
  const [ja, en] = QUOTES[Math.floor(Date.now() / 864e5) % QUOTES.length];
  return (
    <footer className="border-t px-4 py-6 text-center text-caption text-muted-foreground">
      <p className="text-base font-medium text-foreground">{ja}</p>
      <p>{en}</p>
    </footer>
  );
}
