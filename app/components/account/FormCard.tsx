import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";

/** The card of an account form: its title, what it is for, then the form. */
export function FormCard({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-caption text-muted-foreground">{description}</p>}
      </div>
      {children}
    </Card>
  );
}
