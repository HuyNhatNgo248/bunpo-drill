import { RotateCw } from "lucide-react";
import { Link } from "react-router";
import { AppHeader } from "~/components/layout/header";
import { Button } from "~/components/ui/button";
import type { ErrorCopy } from "~/lib/errors";

/** The 404 and 500 page, all in Japanese: a kanji tile, what happened, and the way back. */
export function ErrorPage({ copy }: { copy: ErrorCopy }) {
  return (
    <div className="min-h-screen">
      {/* No "← Mock tests" link here: the brand and the button below lead home. */}
      <AppHeader />
      <main
        lang="ja"
        className="mx-auto flex max-w-205 flex-col items-center gap-5 px-4 pt-14 pb-16 text-center font-jp md:gap-6 md:px-6 md:pt-24"
      >
        <div
          aria-hidden="true"
          className="flex size-20 items-center justify-center rounded-2xl bg-primary-soft text-tile font-bold text-primary md:size-24 md:text-5xl"
        >
          {copy.kanji}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-caption font-semibold text-primary tabular-nums">エラー {copy.status}</span>
          <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">{copy.title}</h1>
        </div>

        {copy.description && (
          <p className="max-w-105 text-body-sm leading-relaxed text-subtle-foreground">{copy.description}</p>
        )}

        <div className="flex w-full max-w-80 flex-col gap-2 sm:w-auto sm:max-w-none sm:flex-row">
          {copy.retry && (
            <Button onClick={() => window.location.reload()}>
              <RotateCw aria-hidden="true" />
              再読み込み
            </Button>
          )}
          <Button asChild variant={copy.retry ? "outline" : "default"}>
            <Link to="/">テスト一覧に戻る</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
