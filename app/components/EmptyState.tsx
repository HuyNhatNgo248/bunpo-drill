import type { ReactNode } from "react";

/** Says a list is empty, and why: a heading and a line, centred, with no box around them. */
export function EmptyState({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-12 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-115 text-muted-foreground">{children}</p>
    </div>
  );
}
