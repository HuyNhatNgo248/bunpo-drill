import { useState } from "react";
import { AppHeader } from "~/components/layout/header";
import { NotebookFigure } from "~/components/layout/notebook-figure";
import { Card } from "~/components/ui/card";

/** What the drawing's caption says: the week under the pointer, or the six weeks the notebook holds. */
const captionOf = (part: string) => (part === "rest" ? "第1週〜第6週" : part);

/**
 * The page around the sign-in forms: one card, with the notebook drawing on a panel beside the form
 * (above it on phones), what the app is for under the drawing, and the form with a title and a line on what to do.
 */
export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const [part, setPart] = useState("rest");

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="flex justify-center px-4 pt-6 pb-16 md:pt-16">
        <Card className="grid w-full max-w-95 overflow-hidden md:max-w-220 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-3 border-b bg-muted px-6 py-6 md:border-r md:border-b-0 md:px-10 md:py-12">
            {/* The drawing keeps room at its foot for a tab pulled all the way out; the text below may sit in it. */}
            <NotebookFigure className="-mb-6 w-full max-w-60 md:-mb-12 md:max-w-90" onRead={setPart} />
            <p className="text-center text-sm font-medium text-secondary-foreground">文法ノートから作る、JLPT形式の模擬試験。</p>
            {/* It follows the pointer over the drawing, so like the drawing it is not read out. */}
            <p aria-hidden="true" className="text-caption text-muted-foreground tabular-nums">
              {captionOf(part)}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-5 p-6 md:p-10">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              <p className="text-caption text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
        </Card>
      </main>
    </div>
  );
}
