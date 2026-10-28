import { Card } from "~/components/ui/card";

/** The days left until the next JLPT, with its date and how many daily tests fit before it. */
export function ExamCountdown({ exam }: { exam: { date: string; daysLeft: number } }) {
  const [year, month, day] = exam.date.split("-").map(Number);
  return (
    <section aria-labelledby="exam-countdown">
      <Card className="flex flex-col gap-5 p-5 font-jp md:flex-row md:items-center md:justify-between md:gap-8 md:p-7">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 id="exam-countdown" className="text-xl font-bold text-balance">
            次の日本語能力試験（JLPT）
          </h2>
          <p className="text-base text-secondary-foreground tabular-nums">
            {year}年{month}月{day}日（日）
          </p>
          <p className="text-caption leading-sentence text-muted-foreground">
            {exam.daysLeft === 0
              ? "今日が試験日です。がんばってください。"
              : `1日1回の模擬試験なら、試験日までに${exam.daysLeft}回解けます。`}
          </p>
        </div>
        {exam.daysLeft > 0 && (
          <p className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-sm text-subtle-foreground">あと</span>
            <span className="text-score leading-none font-bold text-primary tabular-nums">{exam.daysLeft}</span>
            <span className="text-base font-bold">日</span>
          </p>
        )}
      </Card>
    </section>
  );
}
