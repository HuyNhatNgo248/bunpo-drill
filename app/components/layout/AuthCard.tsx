import { AppHeader } from "~/components/layout/header";
import { Card } from "~/components/ui/card";

/** The page around the sign-in forms: one card with a title, a line on what to do, and the form. */
export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="flex justify-center px-4 pt-6 pb-16 md:pt-16">
        <Card className="flex w-full max-w-95 flex-col gap-5 p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-caption text-muted-foreground">{description}</p>
          </div>
          {children}
        </Card>
      </main>
    </div>
  );
}
