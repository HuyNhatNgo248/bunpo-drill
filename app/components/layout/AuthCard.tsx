import { Trans } from "@lingui/react/macro";
import { AppHeader } from "~/components/layout/header";
import { NotebookFigure } from "~/components/layout/notebook-figure";
import { Card } from "~/components/ui/card";

/**
 * The page around the sign-in forms: one card, with the notebook drawing on a panel beside the form
 * (desktop only; phones and tablets get the form alone), what the app is for under the drawing, and the form with a title and a line on what to do.
 */
export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="flex justify-center px-4 pt-6 pb-16 md:pt-16">
        <Card className="grid w-full max-w-95 overflow-hidden lg:max-w-220 lg:grid-cols-2">
          <div className="hidden flex-col items-center justify-center gap-3 border-r px-10 py-12 lg:flex">
            {/* The drawing keeps room at its foot for a tab pulled all the way out; the text below may sit in it. */}
            <NotebookFigure className="-mb-12 w-full max-w-90" />
            <p className="text-center text-sm font-medium text-secondary-foreground">
              <Trans>JLPT grammar practice, in the real test's format.</Trans>
            </p>
          </div>
          <div className="flex flex-col justify-center gap-5 p-6 lg:p-10">
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
