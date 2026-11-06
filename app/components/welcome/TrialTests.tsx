import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Tabs } from "radix-ui";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { LEVELS } from "~/lib/levels";
import { cn } from "~/lib/utils";
import type { TrialSummary } from "~/lib/views";
import { AutoHeight } from "./AutoHeight";
import { SUBJECTS, SubjectList } from "./SubjectList";

/**
 * The practice sets a visitor can take without an account: a level menu and a tab per subject, as on the signed-in home,
 * then that level's tests as cards. The level picked stays when the subject changes, where that subject has it.
 */
export function TrialTests({ tests }: { tests: TrialSummary[] }) {
  const subjects = SUBJECTS.filter((kind) => tests.some((test) => test.kind === kind));
  const [subject, setSubject] = useState<string>(subjects[0] ?? "grammar");
  const [level, setLevel] = useState<string>("N2");
  if (subjects.length === 0) return null;
  const levelsOf = (kind: string) => LEVELS.filter((l) => tests.some((test) => test.kind === kind && test.level === l));
  const levels = levelsOf(subject);
  // A level this subject has no tests for shows its first one.
  const shown = levels.find((l) => l === level) ?? levels[0];
  return (
    <section aria-labelledby="trial-tests" className="flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-col gap-2">
        <h2 id="trial-tests" className="text-xl font-bold text-balance">
          <Trans>Try a practice set, no account needed</Trans>
        </h2>
        <p className="max-w-160 leading-sentence text-subtle-foreground">
          <Trans>Each set mixes questions from the whole level, in the real exam's format. Graded as soon as you submit. Your answers aren't saved, so you can take each set as often as you like.</Trans>
        </p>
      </div>
      <Tabs.Root value={subject} onValueChange={setSubject} className="flex flex-col gap-4">
        {/* The level on the left of the subjects, as on the signed-in home. */}
        <div className="flex flex-wrap items-center gap-3">
          <LevelMenu levels={levels} shown={shown} onPick={setLevel} />
          <SubjectList subjects={subjects} value={subject} onPick={setSubject} />
        </div>
        <AutoHeight>
          {subjects.map((kind) => (
            <Tabs.Content key={kind} value={kind} className="outline-none">
              <ul className="grid gap-3 sm:grid-cols-3 md:gap-4">
                {tests
                  .filter((test) => test.kind === kind && test.level === shown)
                  .map((test) => (
                    <TestCard key={test.id} test={test} />
                  ))}
              </ul>
            </Tabs.Content>
          ))}
        </AutoHeight>
      </Tabs.Root>
    </section>
  );
}

/**
 * The level, as the signed-in home's LevelSwitch looks. That one links to ?level=, which would scroll this page to the
 * top, so this one only sets the level shown. Only the subject's levels are offered.
 */
function LevelMenu({ levels, shown, onPick }: { levels: readonly string[]; shown: string; onPick: (level: string) => void }) {
  const { t } = useLingui();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label={t`Level: ${shown}`} className="h-11 gap-2 px-3.5 text-base font-semibold">
          {shown}
          <ChevronDown aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {levels.map((level) => (
          <DropdownMenuItem
            key={level}
            onSelect={() => onPick(level)}
            className={cn("font-semibold", level === shown && "bg-primary-soft text-primary-soft-foreground")}
          >
            {level}
            {level === shown && <Check aria-hidden="true" className="ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** One test as a card: its title and size, and the way in. The whole card opens it. */
function TestCard({ test }: { test: TrialSummary }) {
  const total = test.questionCount;
  return (
    <li className="group relative flex flex-col gap-5 rounded-xl border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-primary-border hover:shadow-md has-focus-visible:border-primary-border motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:p-5">
      {/* Its ::after covers the card, so a tap anywhere on it opens the test. */}
      <Link to={`/try/${test.id}`} className="text-foreground no-underline outline-none after:absolute after:inset-0">
        <span className="sr-only">{test.level} </span>
        <span lang="ja" className="font-jp text-lg font-semibold">
          {test.title}
        </span>
      </Link>
      <div className="flex items-center justify-between gap-3">
        <span className="text-caption text-muted-foreground">
          <Plural value={total} one="# question" other="# questions" />
        </span>
        {/* The link is the whole card; this only looks like its way in. */}
        <span aria-hidden="true" className="flex items-center gap-1 text-sm font-semibold text-primary">
          <Trans>Start</Trans>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </li>
  );
}
