import { Card } from "~/components/ui/card";

/** What the home page shows before Claude has made a test. */
export function EmptyState() {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed border-input p-7 text-center">
      <h2 className="text-base font-semibold">模擬試験はまだありません</h2>
      <p className="max-w-115 text-muted-foreground">Claudeに文法ノートからテストを作ってもらうと、ここに表示されます。</p>
    </Card>
  );
}
