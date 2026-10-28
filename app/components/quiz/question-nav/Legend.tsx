/** What the two colours of the question numbers mean. Screen readers hear it in each button's label instead. */
export function Legend() {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-indigo" />
        回答済み
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border border-border bg-card" />
        未回答
      </span>
    </div>
  );
}
