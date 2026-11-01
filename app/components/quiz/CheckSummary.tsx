import { useLingui } from "@lingui/react/macro";
import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import type { ResultSection } from "~/lib/views";
import { jumpTo } from "./question-nav/helpers/jumpTo";
import { QuestionGrid, type QuestionMark } from "./question-nav/QuestionGrid";

const SUMMARY_MARKS: QuestionMark[] = ["correct", "wrong", "unanswered"];

/**
 * Opens when a part comes back checked: how many of its questions are right, wrong and blank, and its question
 * numbers in those marks. Picking a number closes it and jumps to that graded answer.
 */
export function CheckSummary({ section }: { section: ResultSection }) {
  const { t } = useLingui();
  const [open, setOpen] = useState(true);
  const target = useRef<number | null>(null);
  const questions = section.groups.flatMap((group) => group.questions);
  const marks = new Map(
    questions.map((q): [string, QuestionMark] => [q.id, q.correct ? "correct" : q.yours === null ? "unanswered" : "wrong"]),
  );
  const no = section.no;
  const score = section.correct;
  const unanswered = questions.filter((q) => q.yours === null).length;
  const wrong = section.total - score - unanswered;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent
        // The dialog has closed and released the scroll lock: jump now instead of restoring focus.
        onCloseAutoFocus={(event) => {
          if (target.current === null) return;
          event.preventDefault();
          jumpTo(target.current);
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t`Part ${no} checked`}</AlertDialogTitle>
          <AlertDialogDescription>{t`${score} correct · ${wrong} wrong · ${unanswered} unanswered`}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4">
          <QuestionGrid
            sections={[section]}
            markOf={(id) => marks.get(id) ?? "unanswered"}
            marks={SUMMARY_MARKS}
            onPick={(num) => {
              target.current = num;
              setOpen(false);
            }}
            touch
          />
        </div>
        <AlertDialogFooter>
          {/* The cancel button, so it takes the focus when the dialog opens. */}
          <AlertDialogCancel variant="default">{t`Keep going`}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
