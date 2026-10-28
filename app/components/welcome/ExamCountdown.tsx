import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Card } from "~/components/ui/card";

/** The days left until the next JLPT, with its date and how many daily tests fit before it. */
export function ExamCountdown({ exam }: { exam: { date: string; daysLeft: number } }) {
  const { i18n } = useLingui();
  const [year, month, day] = exam.date.split("-").map(Number);
  // UTC on both sides, so the server and the browser print the same day.
  const date = new Intl.DateTimeFormat(i18n.locale, { dateStyle: "full", timeZone: "UTC" }).format(Date.UTC(year, month - 1, day));
  const daysLeft = exam.daysLeft;
  return (
    <section aria-labelledby="exam-countdown">
      <Card className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:gap-8 md:p-7">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 id="exam-countdown" className="text-xl font-bold text-balance">
            <Trans>The next JLPT</Trans>
          </h2>
          <p className="text-base text-secondary-foreground tabular-nums">{date}</p>
          <p className="text-caption leading-sentence text-muted-foreground">
            {daysLeft === 0 ? (
              <Trans>It's exam day today. Good luck!</Trans>
            ) : (
              <Plural
                value={daysLeft}
                one="With one mock test a day, you can take # test before the exam."
                other="With one mock test a day, you can take # tests before the exam."
              />
            )}
          </p>
        </div>
        {daysLeft > 0 && (
          <p className="flex shrink-0 items-baseline gap-1.5">
            <Trans>
              <span className="text-sm text-subtle-foreground">in</span>{" "}
              <span className="text-score leading-none font-bold text-primary tabular-nums">{daysLeft}</span>{" "}
              <span className="text-base font-bold">
                <Plural value={daysLeft} one="day" other="days" />
              </span>
            </Trans>
          </p>
        )}
      </Card>
    </section>
  );
}
