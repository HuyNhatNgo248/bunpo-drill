import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { ArrowRightIcon } from "lucide-react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

/** The days left until the next JLPT, with its date, how many daily tests fit before it, and a sign-up button. */
export function ExamCountdown({ exam }: { exam: { date: string; daysLeft: number } }) {
  const { i18n } = useLingui();
  const [year, month, day] = exam.date.split("-").map(Number);
  // UTC on both sides, so the server and the browser print the same day.
  const date = new Intl.DateTimeFormat(i18n.locale, { dateStyle: "full", timeZone: "UTC" }).format(Date.UTC(year, month - 1, day));
  const daysLeft = exam.daysLeft;
  return (
    <section aria-labelledby="exam-countdown">
      {/* Two columns: the title and date beside the count, then the line and the button. On phones both of those take the full width. */}
      <Card className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 p-5 md:gap-x-8 md:p-7">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="exam-countdown" className="text-xl font-bold text-balance">
            <Trans>The next JLPT</Trans>
          </h2>
          <p className="text-body-sm text-secondary-foreground tabular-nums md:text-base">{date}</p>
        </div>
        {daysLeft > 0 && (
          <p className="flex items-baseline gap-1.5 justify-self-end">
            <Trans>
              <span className="text-sm text-subtle-foreground max-sm:sr-only">in</span>{" "}
              <CountUp to={daysLeft} className="text-title leading-none font-bold text-primary tabular-nums md:text-score" />{" "}
              <span className="text-base font-bold">
                <Plural value={daysLeft} one="day" other="days" />
              </span>
            </Trans>
          </p>
        )}
        <p className="col-span-2 col-start-1 text-caption leading-sentence text-muted-foreground md:col-span-1">
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
        <Button asChild size="lg" variant="outline" className="col-span-2 md:col-span-1 md:justify-self-end">
          <Link to="/signup">
            <Trans>Start practicing today</Trans>
            <ArrowRightIcon aria-hidden />
          </Link>
        </Button>
      </Card>
    </section>
  );
}

/** The number, counting up from 0 the first time it scrolls into view. The server and readers get the number itself. */
function CountUp({ to, className }: { to: number; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const count = useMotionValue(to);
  const shown = useTransform(count, Math.round);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(count, to, { from: 0, duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, reduce, to, count]);

  return (
    <motion.span ref={ref} className={className}>
      {shown}
    </motion.span>
  );
}
