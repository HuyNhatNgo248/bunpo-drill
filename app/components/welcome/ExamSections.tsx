import { Card } from "~/components/ui/card";

/** The three sections of the exam's 文法 part, in their real order, with a tiny example of each. */
const SECTIONS = [
  { no: 1, name: "文法形式の判断", count: "15問", how: "文の（　）に入る、いちばん自然な形を4つから選びます。", example: "雨が降っている（　）、試合は行われた。" },
  { no: 2, name: "文の組み立て", count: "15問", how: "4つの言葉を並べかえて、★に入るものを選びます。", example: "彼は ＿ ＿ ★ ＿ 合格した。" },
  { no: 3, name: "文章の文法", count: "3文章 × 5問", how: "文章を読んで、流れに合う言葉を空欄に入れます。", example: "毎日練習した（1）、合格できた。" },
];

export function ExamSections() {
  return (
    <section aria-labelledby="exam-sections" className="flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-col gap-2">
        <h2 id="exam-sections" className="font-jp text-xl font-bold text-balance">
          本番と同じ、3つの問題形式
        </h2>
        <p className="max-w-160 font-jp leading-sentence text-subtle-foreground">
          JLPTの「文法」パートと同じ順番・同じ形式です。各問題15問、合計45問が基本で、問題数は変えられます。
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        {SECTIONS.map((section) => (
          <Card key={section.no} className="flex min-w-0 flex-col gap-2 p-4.5 font-jp md:p-5">
            <div className="flex items-baseline gap-2">
              <span className="text-body-sm font-bold">問題{section.no}</span>
              <span className="text-xs font-semibold text-indigo tabular-nums">{section.count}</span>
            </div>
            <h3 className="text-sm font-medium text-secondary-foreground">{section.name}</h3>
            <p className="text-caption leading-sentence text-muted-foreground">{section.how}</p>
            <p className="rounded-lg bg-muted px-2.5 py-2 text-caption leading-sentence text-secondary-foreground">
              {section.example}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
