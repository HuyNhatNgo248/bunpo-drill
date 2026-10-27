import { useNavigation } from "react-router";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Button } from "~/components/ui/button";
import type { QuizSection } from "~/lib/views";
import { QuestionSheet } from "./question-nav/QuestionSheet";

/**
 * The bar pinned to the bottom: the error of a failed submit, the question list (below desktop),
 * and the clear and submit buttons. Submitting with questions left asks first.
 */
export function SubmitBar({
  sections,
  answered,
  left,
  error,
  onClear,
  onSubmit,
}: {
  sections: QuizSection[];
  answered: Set<string>;
  left: number;
  error?: string;
  onClear: () => void;
  onSubmit: () => void;
}) {
  const submitting = useNavigation().state !== "idle";

  const submitButton = (onClick?: () => void) => (
    <Button size="lg" disabled={submitting} onClick={onClick} className="font-semibold md:px-5 md:font-medium">
      {submitting ? "提出中…" : "提出する"}
    </Button>
  );

  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex flex-col gap-2 border-t bg-card px-4 pt-3 pb-5 md:bottom-4 md:mx-0 md:mt-0 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3 md:rounded-xl md:border md:px-4 md:py-3.5 md:shadow-float">
      {error && (
        <span role="alert" className="w-full text-center text-caption text-primary-soft-foreground md:text-left md:text-sm">
          {error}
        </span>
      )}
      <QuestionSheet sections={sections} answered={answered} remaining={left} className="lg:hidden" />
      <span role="status" className="hidden text-sm text-subtle-foreground lg:inline">
        {left > 0 ? `未回答 ${left}問` : "すべて回答済み"}
      </span>
      <div className="grid grid-cols-actions gap-2 md:flex">
        <Button variant="outline" size="lg" onClick={onClear} className="text-secondary-foreground">
          <span className="md:hidden">クリア</span>
          <span className="hidden md:inline">回答をクリア</span>
        </Button>
        {left > 0 ? (
          <ConfirmDialog
            title={`未回答が${left}問あります。提出しますか？`}
            description="未回答の問題は不正解になります。"
            confirmLabel="提出する"
            cancelLabel="解答を続ける"
            onConfirm={onSubmit}
          >
            {submitButton()}
          </ConfirmDialog>
        ) : (
          submitButton(onSubmit)
        )}
      </div>
    </div>
  );
}
