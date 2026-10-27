import { Card } from "~/components/ui/card";

export function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-0.5 px-3.5 py-3 md:gap-1 md:px-5 md:py-4">
      <div className="text-xs text-muted-foreground md:text-[13px]">{label}</div>
      <div className="text-xl font-semibold md:text-2xl">{value}</div>
    </Card>
  );
}
