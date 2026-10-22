import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "cn";
import { ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { Form, Link, useFetcher, useFetchers } from "react-router";
import type { Route } from "./+types/home";
import { AppHeader } from "~/components/app-header";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { GrammarChips } from "~/components/grammar-chips";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { toSummary } from "~/lib/grading.server";
import { listTests } from "~/lib/tests.server";
import type { TestSummary } from "~/lib/views";

export function meta() {
  return [{ title: "模擬試験 · 文法ドリル" }];
}

export async function loader() {
  const tests = (await listTests()).map(toSummary);
  const taken = tests.filter((test) => test.result);
  const average = taken.length
    ? Math.round(taken.reduce((sum, test) => sum + test.result!.percent, 0) / taken.length)
    : null;
  const toReview = new Set(
    taken.flatMap((test) => test.review.filter((chip) => !chip.reviewed).map((chip) => chip.pattern)),
  ).size;
  return { tests, stats: { average, toReview, taken: taken.length } };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { stats } = loaderData;
  const clearAll = useFetcher({ key: "clear-all" });
  const reorder = useFetcher({ key: "reorder" });
  const deleting = new Set(
    useFetchers()
      .filter((f) => f.formMethod === "DELETE" && f.formAction?.startsWith("/api/tests/"))
      .map((f) => f.formAction!.slice("/api/tests/".length)),
  );
  // Hide deleted tests right away instead of waiting for the reload.
  const tests = clearAll.state === "idle" ? loaderData.tests.filter((test) => !deleting.has(test.id)) : [];
  // Likewise show a dragged test in its new place while the order saves.
  const savingOrder = reorder.state === "idle" ? null : (reorder.json as { order: string[] }).order;
  if (savingOrder) tests.sort((a, b) => savingOrder.indexOf(a.id) - savingOrder.indexOf(b.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = tests.map((test) => test.id);
    const order = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    // flushSync: render the new order in the same frame the drag ends, so the row doesn't jump back first.
    reorder.submit({ order }, { method: "patch", action: "/api/tests", encType: "application/json", flushSync: true });
  };

  // What screen readers hear while dragging; dnd-kit's own words are English.
  const titleOf = (id: UniqueIdentifier) => tests.find((test) => test.id === id)?.title;
  const placeOf = (id: UniqueIdentifier) => tests.findIndex((test) => test.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `「${titleOf(active.id)}」を持ち上げました。`,
    onDragOver: ({ active, over }) =>
      over ? `「${titleOf(active.id)}」を${placeOf(over.id)}番目に移動しました。` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `「${titleOf(active.id)}」を${placeOf(over.id)}番目に置きました。` : undefined,
    onDragCancel: ({ active }) => `「${titleOf(active.id)}」の移動を取り消しました。`,
  };

  return (
    <div className="min-h-screen">
      <AppHeader logout />
      <main lang="ja" className="mx-auto flex max-w-[1040px] flex-col gap-4 px-4 pt-5 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <h1 className="text-2xl font-bold tracking-tight md:text-[28px]">模擬試験</h1>
          {tests.length > 0 && (
            <ConfirmDialog
              title="模擬試験をすべて削除しますか？"
              description={`${tests.length}件のテストと結果がすべて削除されます。この操作は取り消せません。`}
              confirmLabel="すべて削除"
              onConfirm={() => clearAll.submit(null, { method: "delete", action: "/api/tests" })}
            >
              <Button variant="outline" className="px-3 text-[13px] text-secondary-foreground md:px-4 md:text-sm">
                <Trash2 aria-hidden="true" />
                <span className="md:hidden">すべて削除</span>
                <span className="hidden md:inline">模擬試験をすべて削除</span>
              </Button>
            </ConfirmDialog>
          )}
        </div>

        {tests.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] md:gap-3">
              <Stat label="平均正答率" value={stats.average === null ? "—" : `${stats.average}%`} />
              <Stat label="要復習の文法" value={stats.toReview} />
              <Stat
                label="受験済み"
                value={
                  <>
                    {stats.taken}{" "}
                    <span className="text-[13px] font-normal text-muted-foreground md:text-sm">/ {tests.length}</span>
                  </>
                }
              />
            </div>
            <DndContext
              id="test-list"
              sensors={sensors}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              accessibility={{
                announcements,
                screenReaderInstructions: {
                  draggable: "スペースキーで持ち上げ、上下の矢印キーで移動し、もう一度スペースキーで置きます。Escキーで取り消せます。",
                },
              }}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={tests.map((test) => test.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-4 md:gap-0 md:overflow-hidden md:rounded-xl md:border md:bg-card">
                  {tests.map((test) => (
                    <TestRow key={test.id} test={test} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </>
        ) : (
          <Card className="flex flex-col items-center gap-2 border-dashed border-input p-7 text-center">
            <h2 className="text-base font-semibold">模擬試験はまだありません</h2>
            <p className="max-w-[460px] text-muted-foreground">
              Claudeに文法ノートからテストを作ってもらうと、ここに表示されます。
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-0.5 px-3.5 py-3 md:gap-1 md:px-5 md:py-4">
      <div className="text-xs text-muted-foreground md:text-[13px]">{label}</div>
      <div className="text-xl font-semibold md:text-2xl">{value}</div>
    </Card>
  );
}

function TestRow({ test }: { test: TestSummary }) {
  const [open, setOpen] = useState(false);
  const sortable = useSortable({ id: test.id, attributes: { roleDescription: "並べ替え可能" } });
  const quizHref = `/tests/${test.id}`;
  const weeks = test.weeks.map((week) => `第${week}週`).join("・");

  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/60 md:items-center md:gap-4 md:rounded-none md:border-x-0 md:border-t-0 md:p-5 md:last:border-b-0",
        sortable.isDragging && "relative z-10 shadow-float hover:bg-card",
      )}
    >
      {/* Drag by this handle only, so the rest of the row still scrolls, opens the test and works its buttons. */}
      <button
        type="button"
        ref={sortable.setActivatorNodeRef}
        {...sortable.attributes}
        {...sortable.listeners}
        aria-label={`「${test.title}」を並べ替え`}
        className="-my-0.5 -ml-2 flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-faint outline-none hover:text-subtle-foreground focus-visible:ring-3 focus-visible:ring-ring/40 active:cursor-grabbing md:-ml-3 md:h-10"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>

      <Link
        to={test.result ? `${quizHref}/results` : quizHref}
        className="flex min-w-0 flex-1 flex-col gap-1 text-foreground no-underline md:flex-[999_1_380px] md:gap-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft" className="text-[11px] md:text-xs">
            {test.level}
          </Badge>
          <span className="text-base font-semibold">{test.title}</span>
          {test.result && (
            <Badge variant="outline">
              {test.result.score} / {test.result.total}
            </Badge>
          )}
        </div>
        <div className="text-[13px] text-muted-foreground">
          {test.questionCount}問
          {weeks && <span lang="ja"> · {weeks}</span>}
        </div>
      </Link>

      <DeleteTest test={test} className="-mt-2 -mr-2 md:hidden" />

      <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-[1_1_auto] md:flex-wrap md:items-center md:justify-end">
        {test.result ? (
          <>
            {/* Retake clears the last result and review chips on the server, then opens the quiz. */}
            <Form method="post" action={`${quizHref}/retake`} className="contents">
              <Button type="submit" variant="outline" className={cn("md:order-2", test.review.length === 0 && "col-span-2")}>
                もう一度受ける
              </Button>
            </Form>
            {test.review.length > 0 && (
              <Button variant="outline" aria-expanded={open} onClick={() => setOpen(!open)} className="md:order-1 md:px-3.5">
                復習（{test.review.length}）
                <ChevronDown
                  aria-hidden="true"
                  className={cn("size-3.5 transition-transform duration-150", open && "rotate-180")}
                />
              </Button>
            )}
          </>
        ) : (
          <Button asChild className="col-span-2 md:px-[18px]">
            <Link to={quizHref}>テストを始める</Link>
          </Button>
        )}
        <DeleteTest test={test} className="hidden md:order-3 md:inline-flex" outlined />
      </div>

      {open && <GrammarChips testId={test.id} chips={test.review} className="w-full" />}
    </li>
  );
}

function DeleteTest({ test, outlined = false, className }: { test: TestSummary; outlined?: boolean; className?: string }) {
  const fetcher = useFetcher();
  return (
    <ConfirmDialog
      title={`「${test.title}」を削除しますか？`}
      description="テストと保存された結果が削除されます。この操作は取り消せません。"
      confirmLabel="削除"
      onConfirm={() => fetcher.submit(null, { method: "delete", action: `/api/tests/${test.id}` })}
    >
      <Button
        variant={outlined ? "outline" : "ghost"}
        size="icon"
        aria-label={`「${test.title}」を削除`}
        className={cn(outlined ? "text-subtle-foreground md:w-11" : "text-subtle-foreground", className)}
      >
        <Trash2 aria-hidden="true" className={outlined ? undefined : "size-[18px]"} />
      </Button>
    </ConfirmDialog>
  );
}
