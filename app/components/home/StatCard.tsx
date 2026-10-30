import { Card } from "~/components/ui/card";

/** One figure with its label. The value sits at the bottom, so it lines up across the row when a label wraps to two lines. */
export function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="flex flex-col justify-between gap-0.5 px-3.5 py-3 md:gap-1 md:px-5 md:py-4">
      <div className="text-xs text-muted-foreground md:text-caption">{label}</div>
      <div className="text-xl font-semibold md:text-2xl">{value}</div>
    </Card>
  );
}
